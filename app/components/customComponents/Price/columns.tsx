import type { ColumnDef } from "@tanstack/react-table";
import formatToUSD from "~/utils/formatUSD";

export interface FlatRow {
  item: string;
  description: string | null;
  unit: string | null;
  qty: number | string;
  unit_price: number | string | null;
  price: number | string;
  price_max: number | string | null;
}

export const columns: ColumnDef<FlatRow>[] = [
  {
    accessorKey: "item",
    header: "Item",
    cell: ({ row }) => (
      <span className="break-words whitespace-pre-line">
        {row.getValue("item")}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="break-words whitespace-normal">
        {row.getValue("description")}
      </span>
    ),
  },
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{row.getValue("unit")}</span>
    ),
  },
  {
    accessorKey: "qty",
    header: "Qty",
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{row.getValue("qty")}</span>
    ),
  },
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{row.getValue("unit")}</span>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price: number | string = row.getValue("price");
      const priceMax: number | string | null = row.original.price_max;

      return (
        <span className="whitespace-nowrap">
          {priceMax && priceMax !== "0" && priceMax !== price
            ? `${formatToUSD(+price)} – ${formatToUSD(+priceMax)}`
            : formatToUSD(+price)}
        </span>
      );
    },
  },
];
