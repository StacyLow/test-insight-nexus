import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { databaseService } from "@/services/database";
import { CheckCircle2, XCircle, Loader2, RefreshCcw } from "lucide-react";

export const DbHealthIndicator = () => {
  const {
    data,
    error,
    isFetching,
    isLoading,
    isSuccess,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["db-health"],
    queryFn: () => databaseService.checkDbHealth(),
    enabled: false, // run only when user clicks
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const connected = isSuccess && data?.mongo === "connected" && data?.status === "OK";
  const disconnected = isError || (isSuccess && data?.mongo !== "connected");

  const badgeVariant = connected ? "secondary" : disconnected ? "destructive" : "outline";
  const badgeText = connected ? "DB: Connected" : disconnected ? "DB: Disconnected" : "DB: Idle";

  return (
    <div className="flex items-center gap-3" aria-live="polite" aria-atomic="true">
      <Badge variant={badgeVariant as any} title={data?.timestamp ? `Last check: ${new Date(data.timestamp).toLocaleString()}` : undefined}>
        {connected ? (
          <CheckCircle2 className="mr-1 h-4 w-4" />
        ) : disconnected ? (
          <XCircle className="mr-1 h-4 w-4" />
        ) : isFetching || isLoading ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <Loader2 className="mr-1 h-4 w-4" />
        )}
        {badgeText}
      </Badge>
      <Button
        size="sm"
        variant="outline"
        onClick={() => refetch()}
        disabled={isFetching}
        aria-label="Check database connection"
      >
        {isFetching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCcw className="h-4 w-4" />
        )}
        <span className="sr-only">Check DB</span>
      </Button>
    </div>
  );
};

export default DbHealthIndicator;
