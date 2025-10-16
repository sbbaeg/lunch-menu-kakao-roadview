import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppRestaurant } from "@/lib/types";

interface BlacklistDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  blacklist: AppRestaurant[];
  onToggleBlacklist: (restaurant: AppRestaurant) => void;
}

export function BlacklistDialog({
  isOpen,
  onOpenChange,
  blacklist,
  onToggleBlacklist,
}: BlacklistDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">블랙리스트 관리</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4 mt-4">
          {blacklist.length > 0 ? (
            <ul className="space-y-3">
              {blacklist.map((place) => (
                <li
                  key={place.id}
                  className="flex items-center justify-between p-2 rounded-md border"
                >
                  <div>
                    <p className="font-semibold">{place.placeName}</p>
                    <p className="text-sm text-gray-500">
                      {place.categoryName?.split(">").pop()?.trim()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleBlacklist(place)}
                  >
                    삭제
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>블랙리스트에 등록된 음식점이 없습니다.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}