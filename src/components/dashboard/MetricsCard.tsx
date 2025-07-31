import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "destructive" | "warning";
  icon?: React.ReactNode;
}

export const MetricsCard = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  variant = "default",
  icon 
}: MetricsCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-success/20 bg-success/5";
      case "destructive":
        return "border-destructive/20 bg-destructive/5";
      case "warning":
        return "border-warning/20 bg-warning/5";
      default:
        return "";
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case "success":
        return "text-success";
      case "destructive":
        return "text-destructive";
      case "warning":
        return "text-warning";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className={cn("relative overflow-hidden", getVariantStyles())}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground/70">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className={cn("text-2xl font-bold", getValueColor())}>
            {value}
          </div>
          {trend && (
            <Badge 
              variant={trend === "up" ? "default" : trend === "down" ? "destructive" : "secondary"}
              className="text-xs"
            >
              {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};