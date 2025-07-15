import { Button } from "./ui/button";

import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Input } from "./ui/input";

export function AddIncomeForm() {
    const [date, setDate] = useState<Date>();
    const [calendarOpen, setCalendarOpen] = useState(false);

    return (
        <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" id="date" className="w-48 justify-between font-normal">
                            {date ? date.toLocaleDateString() : "Select date"}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              setDate(date);
                              setCalendarOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <Input type="number" placeholder="Amount" />
                      <Input type="text" placeholder="Category" />
                      <Input type="text" placeholder="Notes" />
                      <Input type="text" placeholder="Attachments" />
                    </div>
                  </div>
                </CardContent>
              </Card>
    )
}