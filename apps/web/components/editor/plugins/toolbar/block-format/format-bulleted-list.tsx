import { INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
} from "lexical";

import { useToolbarContext } from "@/components/editor/context/toolbar-context";
import { blockTypeToBlockName } from "@/components/editor/plugins/toolbar/block-format/block-format-data";
import { SelectItem } from "@/components/ui/select";

const BLOCK_FORMAT_VALUE = "bullet";

export function FormatBulletedList() {
  const { activeEditor, blockType } = useToolbarContext();

  const formatParagraph = () => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatBulletedList = () => {
    if (blockType !== "number") {
      activeEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  return (
    <SelectItem
      key={BLOCK_FORMAT_VALUE}
      onPointerDown={formatBulletedList}
      value={BLOCK_FORMAT_VALUE}
    >
      <div className="flex items-center gap-1 font-normal">
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE].icon}
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE].label}
      </div>
    </SelectItem>
  );
}
