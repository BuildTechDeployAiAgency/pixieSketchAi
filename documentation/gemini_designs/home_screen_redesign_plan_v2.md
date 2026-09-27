# HomeScreen Premium Redesign Plan (V2)

This document outlines the UI updates required in `src/screens/HomeScreen.tsx` to match the "pre-oz" premium design mockups. Claude should execute these changes to replace the current boxy constraints with polished, touch-friendly layouts.

## 1. Segmented Toggle (Transform / Create Story) - ENHANCED
- **Current**: Plain, tiny text with opacity changes in a gray bounding box that feels easy to miss.
- **Required Update**: 
  - **Make it a Standout Feature**: Increase the height, padding, and font size significantly so it acts as a primary navigation header rather than a small toggle.
  - The `modeTabActive` should act as an elevated solid pill (e.g., solid purple `#7c3aed`), wrapping perfectly around the enlarged text/icon with a strong drop shadow to simulate a premium native segmented control.

## 2. The 'Generate Story' Button Fix - CRITICAL ALIGNMENT
- **Current**: Both before and during generation, the `ActivityIndicator` (or magical icon) clips out of the top border, and the text aligns to the bottom left side of the button in an erratic way.
- **Required Update**: 
  - The `Pressable` layout inside `s.storyBtn` currently lacks a strict row container. 
  - *Both* the `isProcessing === true` block AND the `isProcessing === false` block must wrap their icon and text inside a dedicated inner container: `<View className="flex-row items-center justify-center w-full h-14">`.
  - Ensure the padding and height are fixed so the text and spinner/icon sit perfectly horizontally centered alongside each other without clipping the container bounds.

## 3. 'Choose your drawing' Section (Transform Mode)
- **Current**: Two massive floating buttons with `paddingVertical: 32` that feel generic.
- **Required Update**: 
  - Restructure the "Gallery" and "Camera" buttons into perfect rounded-square cards with standard padding.
  - Add descriptive mini-labels: "Upload from photos" (Gallery) and "Take a new photo" (Camera) below the bold titles.
  - Implement a refined drop shadow/elevation instead of standard gray borders.

## 4. 'How it works' Section
- **Current**: Floating text with basic purple circles.
- **Required Update**: 
  - Place the entire list inside a seamless premium container card.
  - Increase the visual weight of the circular number badges (solid purple backgrounds with white text).

## 5. 'Choose a style' Section & Video Badge
- **Current**: Misaligned labels ("Turn this as Cartoon" on multiple lines) and a destructive full-width yellow "VIDEO" bar that breaks the button styling.
- **Required Update**:
  - Convert `s.presetBtn` mapped items into premium horizontal list-card items (`flex-row`, `items-center`, `justify-between`).
  - **Crucial**: Change the text labels to be concise (e.g., "Cartoon", "Pixar Character", "Bring to Life").
  - **Crucial**: Move the "VIDEO" indicator from a full-width block to a sleek, subtle golden/yellow pill badge (`rounded-full px-2 py-0.5 bg-yellow-400`) embedded gracefully on the *right side* of the row.

## 6. 'Pick a character' Section (Story Mode)
- **Current**: 120x120 raw images with a checkmark crammed into the top edge.
- **Required Update**: 
  - Wrap the selected images inside elegant portrait or square cards with subtle padding.
  - Inset the checkmark (`absolute top-2 right-2`) and give it a heavier backing shadow so it floats visibly above the image.

---
**Note to Claude**: Please execute these style changes carefully within `HomeScreen.tsx`, adhering to the NativeWind `style` constraint for `Pressable` components detailed in `AGENTS.md`. Pay extra attention to the alignment of elements inside Pressables to prevent the clipping seen in the original build.
