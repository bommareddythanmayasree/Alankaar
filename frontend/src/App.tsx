import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { WarehouseProvider } from "./app/warehouse/warehouse-context";

export default function App() {
  return (
    <WarehouseProvider>
      <RouterProvider router={router} />
    </WarehouseProvider>
  );
}
