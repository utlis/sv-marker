import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/trpc";
import Home from "./pages";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}
