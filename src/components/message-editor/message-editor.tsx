import React from "react";
import { BetterComponent } from "react-better-components";
import {
  Align,
  Box,
  Button,
  ButtonGroup,
  IconName,
  KeyPressModifiers,
  Orientation,
  TextArea,
  Toolbar,
  ToolbarButton,
} from "react-gjs-renderer";
import type { TextAreaEvent } from "react-gjs-renderer/dist/gjs-elements/gtk3/text-area/text-area";
import { Bound } from "../../utils/decorators/bound";
import { stylesheet } from "../../utils/stylesheet";

type MessageEditorProps = {
  onChange?: (text: string) => void;
  onSend?: (text: string) => void;
};

const backgroundColor = "rgba(36, 36, 36, 0.8)";

const BORDER_RADIUS = 10;

const styles = {
  toolbar: stylesheet({
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
    backgroundColor,
  }),
  buttonContainer: stylesheet({
    backgroundColor,
    borderBottomLeftRadius: BORDER_RADIUS,
    borderBottomRightRadius: BORDER_RADIUS,
  }),
};

export class MessageEditor extends BetterComponent<MessageEditorProps> {
  private textHistory: string[] = [];
  private forwardHistory: string[] = [];
  private text = this.$state("");
  private selection = this.$state<[number, number]>([0, 0]);

  constructor(props: MessageEditorProps) {
    super(props);

    this.$effect(() => {
      const t = this.text.get();
      if (t !== this.textHistory.at(-1)) {
        this.textHistory.push(t);
      }

      this.props.onChange?.(t);
    }, [this.text]);
  }

  private undo() {
    const undone = this.textHistory.pop();
    const lastText = this.textHistory.at(-1);
    this.text.set(lastText ?? "");
    if (undone != null) {
      this.forwardHistory.push(undone);
    }
  }

  private redo() {
    const redone = this.forwardHistory.pop();
    if (redone != null) {
      this.text.set(redone ?? "");
      this.textHistory.push(redone);
    }
  }

  private addMarkersAroundSelected(mark: string) {
    if (this.selection) {
      const [start, end] = this.selection.get()!;
      const characters = this.text.get().split("");

      characters.splice(start, 0, mark);
      characters.splice(end + 1, 0, mark);

      this.text.set(characters.join(""));
    }
  }

  @Bound()
  private handleBoldClick() {
    this.addMarkersAroundSelected("*");
  }

  @Bound()
  private handleItalicClick() {
    this.addMarkersAroundSelected("_");
  }

  @Bound()
  private handleStrikethroughClick() {
    this.addMarkersAroundSelected("~");
  }

  @Bound()
  private handleUnderlineClick() {
    this.addMarkersAroundSelected("_");
  }

  @Bound()
  private handleTextChange(
    e: TextAreaEvent<{
      text: string;
      cursorPosition: number;
    }>
  ) {
    this.text.set(e.text);
  }

  @Bound()
  private handleSelectChange(
    e: TextAreaEvent<{
      selectedText: string;
      selectionStartIndex: number;
      selectionEndIndex: number;
    }>
  ) {
    this.selection.set([e.selectionStartIndex, e.selectionEndIndex]);
  }

  @Bound()
  private handleKeyPress(e: TextAreaEvent<Rg.KeyPressEventData>) {
    if (e.keyCode === 13 && e.modifier === KeyPressModifiers.NONE) {
      this.handleSendClick();
      e.preventDefault();
      return;
    }

    if (e.modifier === KeyPressModifiers.CTRL) {
      if (e.keyCode === "z".codePointAt(0)) {
        this.undo();
        return;
      }

      if (e.keyCode === "y".codePointAt(0)) {
        this.redo();
        return;
      }
    }

    if (e.modifier === KeyPressModifiers.NONE) {
      this.forwardHistory = [];
    }
  }

  @Bound()
  private handlePreviewClick() {}

  @Bound()
  private handleSendClick() {
    if (!this.text.get()) return;
    this.props.onSend?.(this.text.get());
    this.text.set("");
    this.textHistory = [];
    this.forwardHistory = [];
  }

  render() {
    return (
      <Box expandHorizontal horizontalAlign={Align.FILL}>
        <Toolbar
          expandHorizontal
          horizontalAlign={Align.FILL}
          style={styles.toolbar}
        >
          <ToolbarButton
            icon={IconName.FormatTextBold}
            onClick={this.handleBoldClick}
          />
          <ToolbarButton
            icon={IconName.FormatTextItalic}
            onClick={this.handleItalicClick}
          />
          <ToolbarButton
            icon={IconName.FormatTextStrikethrough}
            onClick={this.handleStrikethroughClick}
          />
          <ToolbarButton
            icon={IconName.FormatTextUnderline}
            onClick={this.handleUnderlineClick}
          />
        </Toolbar>
        <TextArea
          onKeyPress={this.handleKeyPress}
          value={this.text.get()}
          onChange={this.handleTextChange}
          expandHorizontal
          horizontalAlign={Align.FILL}
          heightRequest={75}
          onSelectChange={this.handleSelectChange}
          padding={8}
          style={{
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
          }}
        ></TextArea>
        <Box
          expandHorizontal
          horizontalAlign={Align.FILL}
          style={styles.buttonContainer}
        >
          <ButtonGroup
            margin={[4, 6]}
            horizontalAlign={Align.END}
            orientation={Orientation.HORIZONTAL}
          >
            <Button
              horizontalAlign={Align.END}
              onClick={this.handlePreviewClick}
              children={"Send"}
            />
            <Button
              horizontalAlign={Align.END}
              onClick={this.handleSendClick}
              children={"Preview"}
            />
          </ButtonGroup>
        </Box>
      </Box>
    );
  }
}
