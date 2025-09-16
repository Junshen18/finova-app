import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "./ui/tabs";
import { AddIncomeForm } from "./add-income-form";
import { useEffect, useState } from "react";
import { AddExpenseForm } from "./add-expense-form";
import { AddTransferForm } from "./add-transfer-form";
import { X } from "lucide-react";

export function AddTransactionDrawer({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [drawerOpen, setDrawerOpen] = useState(open);
  const [activeTab, setActiveTab] = useState("expense");

  // Sync drawer open state with prop
  useEffect(() => {
    setDrawerOpen(open);
  }, [open]);

  // Use modal for desktop/tablet, drawer for mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleClose = () => {
    setDrawerOpen(false);
    onClose();
  };

  if (isMobile) {
    return (
      <Drawer open={drawerOpen} onOpenChange={(next) => { setDrawerOpen(next); if (!next) onClose(); }} dismissible>
        <DrawerContent className="max-h-[100dvh] h-[96dvh] bg-background overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <DrawerHeader className="border-b border-border pb-4">
            <DrawerTitle className="text-xl font-bold text-foreground mb-4">Add Transaction</DrawerTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-lg">
                <TabsTrigger 
                  value="income" 
                  className="data-[state=active]:bg-[#E9FE52] data-[state=active]:text-black data-[state=active]:shadow-sm text-muted-foreground transition-all duration-200"
                >
                  Income
                </TabsTrigger>
                <TabsTrigger 
                  value="expense"
                  className="data-[state=active]:bg-[#E9FE52] data-[state=active]:text-black data-[state=active]:shadow-sm text-muted-foreground transition-all duration-200"
                >
                  Expense
                </TabsTrigger>
                <TabsTrigger 
                  value="transfer"
                  className="data-[state=active]:bg-[#E9FE52] data-[state=active]:text-black data-[state=active]:shadow-sm text-muted-foreground transition-all duration-200"
                >
                  Transfer
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-2 overflow-y-auto max-h-[calc(96dvh-160px)] pr-1 pb-4">
                <TabsContent value="income" className="space-y-4">
                  <AddIncomeForm onCancel={handleClose} />
                </TabsContent>
                <TabsContent value="expense" className="space-y-4">
                  <AddExpenseForm onCancel={handleClose} />
                </TabsContent>
                <TabsContent value="transfer" className="space-y-4">
                  <AddTransferForm onCancel={handleClose} />
                </TabsContent>
              </div>
            </Tabs>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    );
  }

  // Modal for desktop/tablet
  return (
    <Dialog open={drawerOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-background border-border overflow-y-auto overscroll-contain">
        <DialogHeader className="">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-xl font-bold text-foreground">Add Transaction</DialogTitle>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-lg">
              <TabsTrigger 
                value="income" 
                className="data-[state=active]:bg-[#E9FE52] data-[state=active]:text-black data-[state=active]:shadow-sm text-muted-foreground transition-all duration-200"
              >
                Income
              </TabsTrigger>
              <TabsTrigger 
                value="expense"
                className="data-[state=active]:bg-[#E9FE52] data-[state=active]:text-black data-[state=active]:shadow-sm text-muted-foreground transition-all duration-200"
              >
                Expense
              </TabsTrigger>
              <TabsTrigger 
                value="transfer"
                className="data-[state=active]:bg-[#E9FE52] data-[state=active]:text-black data-[state=active]:shadow-sm text-muted-foreground transition-all duration-200"
              >
                Transfer
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-2">
              <TabsContent value="income" className="space-y-4">
                <AddIncomeForm onCancel={handleClose} />
              </TabsContent>
              <TabsContent value="expense" className="space-y-4">
                <AddExpenseForm onCancel={handleClose} />
              </TabsContent>
              <TabsContent value="transfer" className="space-y-4">
                <AddTransferForm onCancel={handleClose} />
              </TabsContent>
            </div>
          </Tabs>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
} 