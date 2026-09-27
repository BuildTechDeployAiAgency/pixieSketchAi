# HomeScreen Premium Redesign Plan

This document outlines the UI updates required in `src/screens/HomeScreen.tsx` to match the "pre-oz" premium design mockups located in this folder. Claude should execute these changes to replace the current boxy constraints with polished, touch-friendly layouts.

## 1. Segmented Toggle (Transform / Create Story)
- **Current**: Plain text with opacity changes in a large gray bounding box.
- **Required Update**: Upgrade the `modeTab / modeTabActive` styles. The `modeTabActive` should act as an elevated solid pill (solid white or purple, depending on the theme), wrapped perfectly around the text/icon to simulate a native segmented control.

## 2. 'Choose your drawing' Section (Transform Mode)
- **Current**: Two massive buttons with `paddingVertical: 32` that feel generic.
- **Required Update**: 
  - Restructure the "Gallery" and "Camera" buttons into perfect rounded-square cards with standard padding.
  - Add descriptive mini-labels: "Upload from photos" (Gallery) and "Take a new photo" (Camera) below the bold titles.
  - Implement a refined drop shadow/elevation instead of standard gray borders.

## 3. 'How it works' Section
- **Current**: Floating text with basic purple circles.
- **Required Update**: 
  - Place the entire list inside a seamless premium container card.
  - Increase the visual weight of the circular number badges (solid purple backgrounds with white text).

## 4. 'Choose a style' Section & Video Badge
- **Current**: Misaligned labels ("Turn this as Cartoon" on multiple lines) and a destructive full-width yellow "VIDEO" bar that breaks the button styling.
- **Required Update**:
  - Convert `s.presetBtn` mapped items into premium horizontal list-card items (`flex-row items-center justify-between`).
  - **Crucial**: Change the text labels to be concise (e.g., "Cartoon", "Pixar Character", "Bring to Life").
  - **Crucial**: Move the "VIDEO" indicator from a full-width block to a sleek, subtle golden/yellow pill badge (`rounded-full px-2 py-0.5 bg-yellow-400`) embedded gracefully on the *right side* of the row.

## 5. 'Pick a character' Section (Story Mode)
- **Current**: 120x120 images with a checkmark crammed into the top edge.
- **Required Update**: Wrap the selected images inside elegant portrait or square cards with subtle padding. Inset the checkmark (`top-2 right-2`) and give it a heavier backing shadow so it floats visibly above the image.

## 6. The 'Generate Story' Button Fix
- **Current**: The `ActivityIndicator` clips out of the top border, and text aligns to the bottom left.
- **Required Update**: The `Pressable` layout inside `s.storyBtn` needs a strict height container binding. Wrap the icon/spinner and text inside a dedicated inner `<View className="flex-row items-center justify-center h-14 w-full">` to guarantee perfect centering and prevent the spinner from clipping the container bounds.

---
**Note to Claude**: Please execute these style changes carefully within `HomeScreen.tsx`, adhering to the NativeWind `style` constraint for `Pressable` components detailed in `AGENTS.md`.
