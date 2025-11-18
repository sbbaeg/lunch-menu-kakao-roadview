"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Footprints, TramFront, Bus, Train, Ship } from "lucide-react";

const TravelModeIcon = ({ mode }: { mode: string }) => {
  switch (mode) {
    case "WALK":
      return <Footprints className="h-5 w-5" />;
    case "TRANSIT":
      return <Bus className="h-5 w-5" />;
    // Add other transit types if needed
    default:
      return <Footprints className="h-5 w-5" />;
  }
};

const TransitIcon = ({ vehicleType }: { vehicleType: string }) => {
    switch (vehicleType) {
        case 'BUS':
            return <Bus className="h-4 w-4 mr-2" />;
        case 'SUBWAY':
        case 'METRO_RAIL':
            return <TramFront className="h-4 w-4 mr-2" />;
        case 'TRAIN':
        case 'HEAVY_RAIL':
            return <Train className="h-4 w-4 mr-2" />;
        case 'FERRY':
            return <Ship className="h-4 w-4 mr-2" />;
        default:
            return <Bus className="h-4 w-4 mr-2" />;
    }
}

export function DirectionsDisplay({ directions }: { directions: any }) {
  if (!directions || !directions.route) {
    return null;
  }

  const { route } = directions;
  const { legs, duration, distanceMeters } = route;

  const totalDuration = Math.round(parseInt(duration.replace('s', ''), 10) / 60);
  const totalDistance = (distanceMeters / 1000).toFixed(1);

  return (
    <div className="mt-4 space-y-4 p-4 border rounded-lg bg-muted/20">
      <Alert>
        <AlertTitle className="flex items-center gap-2">
          <span>총 소요 시간: {totalDuration}분</span>
          <span>({totalDistance}km)</span>
        </AlertTitle>
      </Alert>

      <div className="space-y-3">
        {legs.map((leg: any, legIndex: number) => (
          <div key={legIndex}>
            {leg.steps.map((step: any, stepIndex: number) => (
              <div key={stepIndex} className="flex items-start gap-3 p-2 border-b last:border-b-0">
                <div className="pt-1">
                    <TravelModeIcon mode={step.travelMode} />
                </div>
                <div className="text-sm">
                  <p dangerouslySetInnerHTML={{ __html: step.navigationInstruction.instructions }} />
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>{step.distanceMeters}m</span>
                    {step.transitDetails && (
                      <div className="flex items-center mt-1 p-2 rounded-md bg-muted/50">
                        <TransitIcon vehicleType={step.transitDetails.transitLine.vehicle.type} />
                        <div>
                            <span className="font-semibold">{step.transitDetails.transitLine.name}</span>
                            <span className="mx-1">|</span>
                            <span>{step.transitDetails.stopCount}개 정류장</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
