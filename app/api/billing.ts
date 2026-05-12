import api from "~/api/axios";

export interface IProjectPriceResponse {
  id: number;
  name: string;
  description: string;
  price: number | string;
  price_max: number | string;
}

export const getProjectPrice = async (
  projectId: string,
): Promise<IProjectPriceResponse> => {
  const response = await api.get<IProjectPriceResponse>(
    `/projects/${projectId}/price`,
  );
  return response.data;
};

export interface SubsystemBillingResponse {
  id: number;
  title: string;
  description: string;
  products_chosen: ProductBillingResponse[];
  products_recommended: ProductBillingResponse[];
  price: number | string;
  price_max: number | string;
  order: number;
  subsystems: SubsystemInnerBillingResponse[];
}

export interface SubsystemInnerBillingResponse {
  id: number;
  title: string;
  description: string;
  products_chosen: ProductBillingResponse[];
  products_recommended: ProductBillingResponse[];
  price: number | string;
  price_max: number | string;
  order: number;
}

export interface ProductBillingResponse {
  id: number;
  sku: string | null;
  name: string;
  description: string | null;
  quantity: number;
  quantity_max: number | null;
  unit: string;
  unit_price: number | string;
  vendor: string | null;
  price: number | string;
  price_max: number | string | null;
}

export const getSubsystemBilling = async (
  projectId: string,
  subsystemId: string,
): Promise<SubsystemBillingResponse> => {
  const response = await api.get<SubsystemBillingResponse>(
    `/projects/${projectId}/systems/${subsystemId}/billing`,
  );
  return response.data;
};

export interface TopProductItem {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  price: string;
}

export interface TopProductsSubsystemResponse {
  id: number;
  order: number;
  title: string;
  description: string;
  top_products: TopProductItem[];
}

/** GET /projects/{id}/billing/top-products?top_n=5 */
export const getTopProducts = async (
  projectId: string,
  topN = 5,
): Promise<TopProductsSubsystemResponse[]> => {
  const response = await api.get<TopProductsSubsystemResponse[]>(
    `/projects/${projectId}/billing/top-products`,
    { params: { top_n: topN } },
  );
  return response.data;
};

/** PUT /projects/{id}/billing/products/{product_id}/quantity — при изменении quantity_max становится равным quantity */
export const updateProductQuantity = async (
  projectId: string,
  productId: string,
  quantity: number,
): Promise<ProductBillingResponse> => {
  const response = await api.put<ProductBillingResponse>(
    `/projects/${projectId}/billing/products/${productId}/quantity`,
    { quantity },
  );
  return response.data;
};
