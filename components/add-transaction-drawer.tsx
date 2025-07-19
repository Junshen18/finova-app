import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Button } from "./ui/button";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "./ui/tabs";
import { AddIncomeForm } from "./add-income-form";
import { useState } from "react";
import { AddExpenseForm } from "./add-expense-form";


export function AddTransactionDrawer({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [drawerOpen, setDrawerOpen] = useState(open);

  // Sync drawer open state with prop
  if (drawerOpen !== open) setDrawerOpen(open);

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="mb-2">Add Transaction</DrawerTitle>
          <Tabs defaultValue="expense" className="w-full items-center justify-center">
            <TabsList>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
            </TabsList>
            <TabsContent value="income" className=" w-full justify-center items-center">
              <AddIncomeForm />
            </TabsContent>
            <TabsContent value="expense" className="w-full justify-center items-center">
              <AddExpenseForm />
            </TabsContent>
            <TabsContent value="transfer">
              <div>Transfer</div>
            </TabsContent>
          </Tabs>
        </DrawerHeader>
        <div className="flex flex-col px-4">
          <DrawerFooter className="py-0 px-4">
            <DrawerClose asChild>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
} 