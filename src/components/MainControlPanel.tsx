import { Button } from "@/components/ui/button";

interface MainControlPanelProps {
  isSearchDisabled: boolean;
  onSearchClick: () => void;
  onRouletteClick: () => void;
  onFilterClick: () => void;
}

export function MainControlPanel({
  isSearchDisabled,
  onSearchClick,
  onRouletteClick,
  onFilterClick,
}: MainControlPanelProps) {
  return (
    <div className="w-full flex gap-2 justify-center">
      <Button 
        onClick={onSearchClick} 
        disabled={isSearchDisabled} 
        size="lg" 
        className="px-6"
      >
        검색
      </Button>
      <Button 
        onClick={onRouletteClick} 
        disabled={isSearchDisabled} 
        size="lg" 
        className="px-6"
      >
        룰렛
      </Button>
      <Button 
        variant="outline" 
        size="lg" 
        onClick={onFilterClick}
      >
        필터
      </Button>
    </div>
  );
}