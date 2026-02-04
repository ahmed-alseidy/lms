"use client";

import { FORMAT_ELEMENT_COMMAND } from "lexical";
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from "lucide-react";

import { useToolbarContext } from "@/components/editor/context/toolbar-context";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AlignmentToolbarPlugin() {
  const { activeEditor } = useToolbarContext();

  const applyAlignment = (align: "left" | "center" | "right") => {
    activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align);
  };

  return (
    <Select
      onValueChange={(value) =>
        applyAlignment(value as "left" | "center" | "right")
      }
    >
      <SelectTrigger className="h-8 w-min gap-1">
        <SelectValue placeholder="Align"/>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="left">
            <div className="flex items-center gap-1 font-normal">
              <AlignLeftIcon className="h-4 w-4" />
              <span>Left</span>
            </div>
          </SelectItem>
          <SelectItem value="center">
            <div className="flex items-center gap-1 font-normal">
              <AlignCenterIcon className="h-4 w-4" />
              <span>Center</span>
            </div>
          </SelectItem>
          <SelectItem value="right">
            <div className="flex items-center gap-1 font-normal">
              <AlignRightIcon className="h-4 w-4" />
              <span>Right</span>
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
