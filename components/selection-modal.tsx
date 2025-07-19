import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

export function SelectionModal({ open, onOpenChange, options, selected, onSelect, title }: { open: boolean, onOpenChange: (open: boolean) => void, options: { id: string, name: string }[], selected: string, onSelect: (id: string) => void, title: string }) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogContent>
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => (
              <Button
                key={opt.id}
                variant={selected === opt.id ? "default" : "outline"}
                onClick={() => {
                  onSelect(opt.id);
                  onOpenChange(false);
                }}
              >
                {opt.name}
              </Button>
            ))}
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              + Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }