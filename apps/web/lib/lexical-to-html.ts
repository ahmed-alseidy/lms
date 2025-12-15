import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  createEditor,
  LexicalNode,
  SerializedEditorState,
  SerializedLexicalNode,
} from "lexical";
import { editorConfig } from "@/components/blocks/editor-00/editor";
import { nodes } from "@/components/blocks/editor-00/nodes";

/**
 * Converts Lexical JSON to HTML using Lexical's built-in utilities
 * @param lexicalJson - The Lexical JSON object (serialized editor state)
 * @returns The HTML string
 */
export function lexicalToHtml(lexicalJson: SerializedEditorState): string {
  if (!lexicalJson || !lexicalJson.root) {
    return "";
  }

  try {
    // Create an editor using the standard createEditor from lexical
    // This avoids type compatibility issues with the headless editor
    const templateEditor = createEditor({
      namespace: "Editor",
      nodes: nodes,
      theme: editorConfig.theme,
      onError: (error) => {
        console.error("Lexical Editor Error:", error);
      },
    });

    // Set the editor state from the provided JSON
    templateEditor.setEditorState(templateEditor.parseEditorState(lexicalJson));

    // Generate HTML from the editor state
    let html = "";

    // We need to use read() to access the editor state safely
    templateEditor.read(() => {
      html = $generateHtmlFromNodes(templateEditor);
    });

    return html;
  } catch (error) {
    console.error("Error converting Lexical JSON to HTML:", error);
    return "";
  }
}
