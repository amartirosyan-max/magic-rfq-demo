import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Minus, Plus } from "lucide-react";
import * as React from "react";
import {
  getSubsystemBilling,
  type ProductBillingResponse,
  type SubsystemBillingResponse,
  updateProductQuantity,
} from "~/api/billing";
import { EQueryKey } from "~/constants/queryKeys";
import { useEffectiveSubsystemId } from "~/hooks/useEffectiveSubsystemId";
import formatUSD from "~/utils/formatUSD";

const INT32_MAX = 2 ** 31 - 1;

interface Section {
  title: string;
  products: ProductBillingResponse[];
  order: number;
}

function buildSections(data: SubsystemBillingResponse): Section[] {
  const sections: Section[] = [];
  if (data.products_recommended?.length) {
    sections.push({
      title: data.title,
      products: data.products_recommended,
      order: data.order,
    });
  }
  (data.subsystems || []).forEach((s) => {
    if (s.products_recommended?.length) {
      sections.push({
        title: s.title,
        products: s.products_recommended,
        order: s.order,
      });
    }
  });
  sections.sort((a, b) => a.order - b.order);
  sections.forEach((s) => {
    s.products = [...s.products].sort((a, b) => a.id - b.id);
  });
  return sections;
}

function formatTotalUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface IPriceProps {
  subsystemId?: string;
}

const Price = ({ subsystemId }: IPriceProps) => {
  const queryClient = useQueryClient();
  const { id, effectiveSubsystemId } = useEffectiveSubsystemId();
  const billingId = subsystemId || effectiveSubsystemId;

  const { data: billingData, isPending: isLoadingBilling } = useQuery({
    queryKey: [EQueryKey.SUBSYSTEM_BILLING, id, billingId],
    queryFn: () => getSubsystemBilling(String(id), String(billingId)),
    enabled: !!id && !!billingId,
  });

  const updateQtyMutation = useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: number;
      quantity: number;
    }) => updateProductQuantity(String(id), String(productId), quantity),
  });

  const sections = React.useMemo(
    () => (billingData ? buildSections(billingData) : []),
    [billingData],
  );

  const qtyKey = (sectionTitle: string, productId: number) =>
    `${sectionTitle}-${productId}`;

  const [qtyState, setQtyState] = React.useState<Record<string, number>>({});
  const [expandedDescIds, setExpandedDescIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  const getQty = React.useCallback(
    (sectionTitle: string, product: ProductBillingResponse) => {
      const key = qtyKey(sectionTitle, product.id);
      if (key in qtyState) return qtyState[key];
      return Math.max(0, Number(product.quantity) || 0);
    },
    [qtyState],
  );

  const setQty = React.useCallback(
    (sectionTitle: string, productId: number, value: number) => {
      const v = Math.min(INT32_MAX, Math.max(0, Math.floor(value)));
      setQtyState((prev) => ({
        ...prev,
        [qtyKey(sectionTitle, productId)]: v,
      }));
    },
    [],
  );

  const sendQtyToServer = React.useCallback(
    (productId: number, quantity: number) => {
      updateQtyMutation.mutate(
        { productId, quantity },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: [EQueryKey.PROJECT_PRICE_DATA, id],
            });
          },
        },
      );
    },
    [updateQtyMutation, queryClient, id],
  );

  const handleQtyChange = React.useCallback(
    (sectionTitle: string, product: ProductBillingResponse, delta: number) => {
      const newQty = Math.max(0, getQty(sectionTitle, product) + delta);
      setQty(sectionTitle, product.id, newQty);
      sendQtyToServer(product.id, newQty);
    },
    [getQty, setQty, sendQtyToServer],
  );

  const handleQtyBlur = React.useCallback(
    (sectionTitle: string, product: ProductBillingResponse) => {
      const qty = getQty(sectionTitle, product);
      sendQtyToServer(product.id, qty);
    },
    [getQty, sendQtyToServer],
  );

  const unitPrice = (p: ProductBillingResponse) => +p.unit_price || 0;

  const sectionTotals = React.useMemo(
    () =>
      sections.map((section) =>
        section.products.reduce(
          (sum, product) =>
            sum + unitPrice(product) * getQty(section.title, product),
          0,
        ),
      ),
    [sections, getQty],
  );
  const grandTotal = sectionTotals.reduce((a, b) => a + b, 0);

  let globalRowIndex = 0;

  if (isLoadingBilling || !billingData) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse bg-white border border-gray-200">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-center py-2 px-5 max-[1600px]:px-2.5 text-[12px] leading-[18px] font-semibold text-[#717680] whitespace-nowrap">
              ID
            </th>
            <th className="text-center py-2 px-5 max-[1600px]:px-2.5 text-[12px] leading-[18px] font-semibold text-[#717680] whitespace-nowrap">
              Part number (SKU)
            </th>
            <th className="text-left py-2 px-5 max-[1600px]:px-2.5 text-[12px] leading-[18px] font-semibold text-[#717680] whitespace-nowrap">
              Product Description
            </th>
            <th className="text-center py-2 px-5 max-[1600px]:px-2.5 text-[12px] leading-[18px] font-semibold text-[#717680] whitespace-nowrap">
              Qty
            </th>
            <th className="text-right py-2 px-5 max-[1600px]:px-2.5 text-[12px] leading-[18px] font-semibold text-[#717680] whitespace-nowrap">
              Price (per unit)
            </th>
            <th className="text-right py-2 px-5 max-[1600px]:px-2.5 text-[12px] leading-[18px] font-semibold text-[#717680] whitespace-nowrap">
              Total Part Price
            </th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section, sectionIndex) => {
            let sectionTotal = 0;
            return (
              <React.Fragment key={`${section.title}-${sectionIndex}`}>
                <tr>
                  <td
                    colSpan={6}
                    className="py-2 px-5 max-[1600px]:px-2.5 text-white font-bold"
                    style={{
                      backgroundColor: "#3744A6",
                      fontSize: "16px",
                      fontWeight: 700,
                    }}
                  >
                    {section.title}
                  </td>
                </tr>
                {section.products.map((product) => {
                  globalRowIndex += 1;
                  const qty = getQty(section.title, product);
                  const up = unitPrice(product);
                  const rowTotal = up * qty;
                  sectionTotal += rowTotal;
                  return (
                    <tr
                      key={`${section.title}-${product.id}`}
                      className="border-b border-gray-200"
                    >
                      <td className="p-5 max-[1600px]:p-2.5 border-b border-gray-200 align-middle text-center">
                        {globalRowIndex}
                      </td>
                      <td className="p-5 max-[1600px]:p-2.5 border-b border-gray-200 align-middle text-center">
                        {product.sku ?? "—"}
                      </td>
                      <td className="p-5 max-[1600px]:p-2.5 border-b border-gray-200 align-middle break-words">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold">
                            {product.name ?? "—"}
                          </span>
                          {(() => {
                            const desc = product.description ?? "";
                            const key = qtyKey(section.title, product.id);
                            const isExpanded = expandedDescIds.has(key);
                            if (!desc)
                              return (
                                <span className="text-gray-600 text-sm">—</span>
                              );
                            if (isExpanded)
                              return (
                                <span className="text-gray-600 text-sm break-words whitespace-pre-wrap">
                                  {desc}
                                </span>
                              );
                            const truncated =
                              desc.length > 50 ? `${desc.slice(0, 50)}…` : desc;
                            return (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedDescIds((prev) =>
                                    new Set(prev).add(key),
                                  )
                                }
                                className="text-gray-600 text-sm text-left w-full min-w-0 hover:text-gray-800 cursor-pointer break-words"
                              >
                                {truncated}
                              </button>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="p-5 max-[1600px]:p-2.5 border-b border-gray-200 align-middle text-center">
                        <div className="flex items-center justify-center gap-1 w-fit mx-auto">
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(section.title, product, -1)
                            }
                            className="p-[6px] inline-flex items-center justify-center cursor-pointer"
                            aria-label="Уменьшить"
                          >
                            <Minus
                              size={16}
                              width={16}
                              height={16}
                              className="shrink-0"
                            />
                          </button>
                          <span className="inline-flex items-stretch relative w-fit max-w-[12ch]">
                            <span
                              className="invisible h-[28px] text-[16px] text-center px-[10px] border-0 whitespace-nowrap tabular-nums"
                              aria-hidden
                            >
                              {qty}
                              {"\u00A0"}
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={INT32_MAX}
                              step={1}
                              value={qty}
                              onChange={(e) => {
                                const v = e.target.value;
                                const n = v === "" ? 0 : parseInt(v, 10);
                                if (!Number.isNaN(n) && n >= 0) {
                                  setQty(
                                    section.title,
                                    product.id,
                                    Math.min(n, INT32_MAX),
                                  );
                                }
                              }}
                              onBlur={() =>
                                handleQtyBlur(section.title, product)
                              }
                              className="absolute inset-0 w-full min-w-[2.25ch] h-[28px] text-[16px] text-center border border-gray-300 rounded px-[10px] tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleQtyChange(section.title, product, 1)
                            }
                            className="p-[6px] inline-flex items-center justify-center cursor-pointer"
                            aria-label="Увеличить"
                          >
                            <Plus
                              size={16}
                              width={16}
                              height={16}
                              className="shrink-0"
                            />
                          </button>
                        </div>
                      </td>
                      <td className="p-5 max-[1600px]:p-2.5 border-b border-gray-200 align-middle whitespace-nowrap text-right">
                        {formatUSD(up)}
                      </td>
                      <td className="p-5 max-[1600px]:p-2.5 border-b border-gray-200 align-middle whitespace-nowrap text-right">
                        {formatUSD(rowTotal)}
                      </td>
                    </tr>
                  );
                })}
                <tr
                  className="border-b border-gray-200"
                  style={{ backgroundColor: "#DCE7F8" }}
                >
                  <td className="py-2 px-5 max-[1600px]:px-2.5" colSpan={5} />
                  <td className="py-2 px-5 max-[1600px]:px-2.5 font-semibold whitespace-nowrap text-right">
                    {formatUSD(sectionTotals[sectionIndex] ?? 0)}
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <div
        className="mt-4 font-bold text-right"
        style={{
          color: "#3744A6",
          fontSize: "24px",
          fontWeight: 700,
        }}
      >
        Total: {formatTotalUSD(grandTotal)}
      </div>
    </div>
  );
};

export default Price;
