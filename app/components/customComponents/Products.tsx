import type {
  SystemProductFamilyResponse,
  SystemProductResponse,
} from "~/types/systemResponse";
import { EUserProjectSelection } from "~/types/systemResponse";
import placeholderImage from "~/assets/placeholder.png";
import { hrUidToImageMap } from "~/constants/assetMapping";
import ActionsButtons from "~/components/customComponents/ActionsButtons";
import TrendingWrapper from "~/components/ui/trending-wrapper";

interface IProductsProps {
  products: SystemProductResponse[] | SystemProductFamilyResponse[];
  type: "products" | "productFamilies";
  onUpdateStatus: (status: EUserProjectSelection | null, id: string) => void;
  isSidebar: boolean;
}

const Products = ({
  products,
  type,
  onUpdateStatus,
  isSidebar,
}: IProductsProps) => {
  const currentYear = String(new Date().getFullYear());

  return (
    <div className="flex flex-col gap-6">
      {isSidebar ? (
        <div className="flex flex-col gap-5">
          {products
            .sort((a, b) => {
              // Recommended products first
              if (a.recommended && !b.recommended) return -1;
              if (!a.recommended && b.recommended) return 1;
              // Then by id
              return Number(a.id) - Number(b.id);
            })
            .map((product) => {
              const isTrending = product.trending === currentYear;

              return (
                <TrendingWrapper isTrending={isTrending} key={product.id}>
                  <div className="flex gap-6">
                    <div className="flex flex-col items-center gap-6 w-full">
                      <div className="flex justify-between w-full gap-[10px] items-center">
                        <div className="block">
                          <img
                            src={
                              product.image_url ||
                              (product.hr_uid
                                ? hrUidToImageMap[
                                    product.hr_uid.replace(/^\$/, "")
                                  ]
                                : null) ||
                              placeholderImage
                            }
                            alt={product.name}
                            className="w-[90px] h-[90px] min-h-[90px] min-w-[90px] self-baseline"
                          />
                        </div>

                        <div className="flex items-start gap-6 justify-between w-full">
                          <div className="flex-col flex gap-1 justify-start pt-1.5">
                            <p className="text-black text-[16px] font-bold">
                              {product.name}
                            </p>
                            <ActionsButtons
                              system={{
                                id: product.id,
                                recommended: product.recommended,
                                status: product.status || null,
                              }}
                              onUpdateStatus={onUpdateStatus}
                              isSidebar={isSidebar}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-black text-[14px] font-normal">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </TrendingWrapper>
              );
            })}
        </div>
      ) : (
        <>
          <h2 className="text-[24px] font-bold leading-[140%] font-[Roboto_Serif] text-[#3a3540]">
            Select {type === "products" ? "Products" : "Product Families"}{" "}
            Options
          </h2>
          <div className="flex flex-col gap-5">
            {products
              .sort((a, b) => {
                // Recommended products first
                if (a.recommended && !b.recommended) return -1;
                if (!a.recommended && b.recommended) return 1;
                // Then by id
                return Number(a.id) - Number(b.id);
              })
              .map((product) => {
                const isTrending = product.trending === currentYear;

                return (
                  <TrendingWrapper isTrending={isTrending} key={product.id}>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-6 w-full">
                        <img
                          src={
                            product.image_url ||
                            (product.hr_uid
                              ? hrUidToImageMap[
                                  product.hr_uid.replace(/^\$/, "")
                                ]
                              : null) ||
                            placeholderImage
                          }
                          alt={product.name}
                          className="w-[180px] h-[180px] min-h-[180px] min-w-[180px] self-baseline"
                        />
                        <div className="flex items-start gap-6 justify-between w-full">
                          <div className="flex-col flex gap-1 justify-start pt-1.5">
                            <p className="text-black text-[16px] font-bold">
                              {product.name}
                            </p>
                            <p className="text-black text-[14px] font-normal">
                              {product.description}
                            </p>
                          </div>
                          <ActionsButtons
                            system={{
                              id: product.id,
                              recommended: product.recommended,
                              status: product.status || null,
                            }}
                            onUpdateStatus={onUpdateStatus}
                            isSidebar={isSidebar}
                          />
                        </div>
                      </div>
                    </div>
                  </TrendingWrapper>
                );
              })}
          </div>
        </>
      )}
    </div>

    // <div className="flex flex-col gap-6">
    //   {isSidebar ? (
    //     <SidebarHeader className="border-sidebar-border h-10 px-2.5">
    //       <TabsList className="bg-transparent">
    //         <TabsTrigger value="products">Products</TabsTrigger>
    //         <TabsTrigger value="table">Table</TabsTrigger>
    //       </TabsList>
    //     </SidebarHeader>
    //   ) : (
    //     <h2 className="text-[24px] font-bold leading-[140%] font-[Roboto_Serif] text-[#3a3540]">
    //       Select {type === "products" ? "Products" : "Product Families"} Options
    //     </h2>
    //   )}
    //   {isSidebar ? (
    //     <>
    //       <TabsContent
    //         value="products"
    //         className="flex flex-col h-full data-[state=active]:flex data-[state=inactive]:hidden"
    //       >
    //         <div className="flex flex-col gap-5">
    //           {products
    //             .sort((a, b) => {
    //               // Recommended products first
    //               if (a.recommended && !b.recommended) return -1;
    //               if (!a.recommended && b.recommended) return 1;
    //               // Then by id
    //               return Number(a.id) - Number(b.id);
    //             })
    //             .map((product) => {
    //               const isTrending = product.trending === currentYear;

    //               return (
    //                 <TrendingWrapper isTrending={isTrending} key={product.id}>
    //                   <div className="flex gap-6">
    //                     <div className="flex items-center gap-6 w-full">
    //                       <img
    //                         src={
    //                           product.image_url ||
    //                           (product.hr_uid
    //                             ? hrUidToImageMap[
    //                                 product.hr_uid.replace(/^\$/, "")
    //                               ]
    //                             : null) ||
    //                           placeholderImage
    //                         }
    //                         alt={product.name}
    //                         className="w-[180px] h-[180px] min-h-[180px] min-w-[180px] self-baseline"
    //                       />
    //                       <div className="flex items-start gap-6 justify-between w-full">
    //                         <div className="flex-col flex gap-1 justify-start pt-1.5">
    //                           <p className="text-black text-[16px] font-bold">
    //                             {product.name}
    //                           </p>
    //                           <p className="text-black text-[14px] font-normal">
    //                             {product.description}
    //                           </p>
    //                         </div>
    //                         <ActionsButtons
    //                           system={{
    //                             id: product.id,
    //                             recommended: product.recommended,
    //                             status: product.status || null,
    //                           }}
    //                           onUpdateStatus={onUpdateStatus}
    //                         />
    //                       </div>
    //                     </div>
    //                   </div>
    //                 </TrendingWrapper>
    //               );
    //             })}
    //         </div>
    //       </TabsContent>
    //       <TabsContent
    //         value="table"
    //         className="flex flex-col h-full data-[state=active]:flex data-[state=inactive]:hidden disabled"
    //       ></TabsContent>
    //     </>
    //   ) : (
    //     <div className="flex flex-col gap-5">
    //       {products
    //         .sort((a, b) => {
    //           // Recommended products first
    //           if (a.recommended && !b.recommended) return -1;
    //           if (!a.recommended && b.recommended) return 1;
    //           // Then by id
    //           return Number(a.id) - Number(b.id);
    //         })
    //         .map((product) => {
    //           const isTrending = product.trending === currentYear;

    //           return (
    //             <TrendingWrapper isTrending={isTrending} key={product.id}>
    //               <div className="flex gap-6">
    //                 <div className="flex items-center gap-6 w-full">
    //                   <img
    //                     src={
    //                       product.image_url ||
    //                       (product.hr_uid
    //                         ? hrUidToImageMap[product.hr_uid.replace(/^\$/, "")]
    //                         : null) ||
    //                       placeholderImage
    //                     }
    //                     alt={product.name}
    //                     className="w-[180px] h-[180px] min-h-[180px] min-w-[180px] self-baseline"
    //                   />
    //                   <div className="flex items-start gap-6 justify-between w-full">
    //                     <div className="flex-col flex gap-1 justify-start pt-1.5">
    //                       <p className="text-black text-[16px] font-bold">
    //                         {product.name}
    //                       </p>
    //                       <p className="text-black text-[14px] font-normal">
    //                         {product.description}
    //                       </p>
    //                     </div>
    //                     <ActionsButtons
    //                       system={{
    //                         id: product.id,
    //                         recommended: product.recommended,
    //                         status: product.status || null,
    //                       }}
    //                       onUpdateStatus={onUpdateStatus}
    //                     />
    //                   </div>
    //                 </div>
    //               </div>
    //             </TrendingWrapper>
    //           );
    //         })}
    //     </div>
    //   )}
    // </div>
  );
};

export default Products;
