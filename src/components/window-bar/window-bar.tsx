import envs from "gapp:env";
import React from "react";
import { BetterComponent } from "react-better-components";
import {
  Box,
  Button,
  HeaderBar,
  IconName,
  PackEnd,
  PopoverMenu,
  PopoverMenuEntry,
  PopoverMenuRadioButton,
} from "react-gjs-renderer";
import type { SyntheticEvent } from "react-gjs-renderer/dist/gjs-elements/rg-types";
import { FontSettings } from "../../quarks/settings/font-size";
import { Bound } from "../../utils/decorators/bound";
import { $quark } from "../../utils/quarks";

export class WindowBar extends BetterComponent {
  private fontSettings = $quark(this, FontSettings);

  get msgSize() {
    return this.fontSettings.get().msgSize;
  }

  get uiSize() {
    return this.fontSettings.get().uiSize;
  }

  @Bound()
  private handleMsgFontSizeChange(
    e: SyntheticEvent<
      { isActive: boolean },
      Rg.Element.PopoverMenuRadioButtonElement
    >,
  ) {
    if (e.isActive) {
      switch (e.targetWidget.text) {
        case "10px":
          FontSettings.setMsgSize(10);
          break;
        case "12px":
          FontSettings.setMsgSize(12);
          break;
        case "14px":
          FontSettings.setMsgSize(14);
          break;
        case "16px":
          FontSettings.setMsgSize(16);
          break;
        case "18px":
          FontSettings.setMsgSize(18);
          break;
        case "20px":
          FontSettings.setMsgSize(20);
          break;
      }
    }
  }

  @Bound()
  private handleUiFontSizeChange(
    e: SyntheticEvent<
      { isActive: boolean },
      Rg.Element.PopoverMenuRadioButtonElement
    >,
  ) {
    if (e.isActive) {
      switch (e.targetWidget.text) {
        case "10px":
          FontSettings.setUiSize(10);
          break;
        case "12px":
          FontSettings.setUiSize(12);
          break;
        case "14px":
          FontSettings.setUiSize(14);
          break;
        case "16px":
          FontSettings.setUiSize(16);
          break;
        case "18px":
          FontSettings.setUiSize(18);
          break;
        case "20px":
          FontSettings.setUiSize(20);
          break;
      }
    }
  }

  render() {
    return (
      <HeaderBar
        showControlButtons
        title={envs.friendlyAppName}
      >
        <PackEnd>
          <Box>
            <PopoverMenu
              renderPopover={() => (
                <>
                  <PopoverMenuEntry
                    label="Messages Font Size"
                    submenuBackButtonLabel="Back"
                  >
                    <PopoverMenuRadioButton
                      radioGroup="msg-font-size"
                      label="10px"
                      selected={this.msgSize === 10}
                      onChange={this.handleMsgFontSizeChange}
                    />
                    <PopoverMenuRadioButton
                      radioGroup="msg-font-size"
                      label="12px"
                      selected={this.msgSize === 12}
                      onChange={this.handleMsgFontSizeChange}
                    />
                    <PopoverMenuRadioButton
                      radioGroup="msg-font-size"
                      label="14px"
                      selected={this.msgSize === 14}
                      onChange={this.handleMsgFontSizeChange}
                    />
                    <PopoverMenuRadioButton
                      radioGroup="msg-font-size"
                      label="16px"
                      selected={this.msgSize === 16}
                      onChange={this.handleMsgFontSizeChange}
                    />
                    <PopoverMenuRadioButton
                      radioGroup="msg-font-size"
                      label="18px"
                      selected={this.msgSize === 18}
                      onChange={this.handleMsgFontSizeChange}
                    />
                    <PopoverMenuRadioButton
                      radioGroup="msg-font-size"
                      label="20px"
                      selected={this.msgSize === 20}
                      onChange={this.handleMsgFontSizeChange}
                    />
                  </PopoverMenuEntry>
                  <PopoverMenuEntry
                    label="UI Font Size"
                    submenuBackButtonLabel="Back"
                  >
                    <PopoverMenuRadioButton
                      radioGroup="ui-font-size"
                      label="10px"
                      selected={this.uiSize === 10}
                      onChange={this.handleUiFontSizeChange}
                    />
                    <PopoverMenuRadioButton
                      radioGroup="ui-font-size"
                      label="12px"
                      selected={this.uiSize === 12}
                      onChange={this.handleUiFontSizeChange}
                    />
                    <PopoverMenuRadioButton
                      radioGroup="ui-font-size"
                      label="14px"
                      selected={this.uiSize === 14}
                      onChange={this.handleUiFontSizeChange}
                    />
                    <PopoverMenuRadioButton
                      radioGroup="ui-font-size"
                      label="16px"
                      selected={this.uiSize === 16}
                      onChange={this.handleUiFontSizeChange}
                    />
                    <PopoverMenuRadioButton
                      radioGroup="ui-font-size"
                      label="18px"
                      selected={this.uiSize === 18}
                      onChange={this.handleUiFontSizeChange}
                    />
                    <PopoverMenuRadioButton
                      radioGroup="ui-font-size"
                      label="20px"
                      selected={this.uiSize === 20}
                      onChange={this.handleUiFontSizeChange}
                    />
                  </PopoverMenuEntry>
                </>
              )}
              renderAnchor={(open) => (
                <Button
                  margin={[0, 10, 0, 0]}
                  icon={IconName.ViewMoreSymbolic}
                  iconPixelSize={22}
                  onClick={open}
                />
              )}
            />
          </Box>
        </PackEnd>
      </HeaderBar>
    );
  }
}
