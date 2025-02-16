import type { ScaledSize } from "react-native";
import { Dimensions } from "react-native";

import type { Bounds, ElementsRecord } from "./context/context";

const window: ScaledSize = Dimensions.get("window");

export const windowWidth = window.width;
export const windowHeight = window.height;

type ElementBounds = {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
};

const M = (x: number, y: number) => `M ${x} ${y}`;
const L = (x: number, y: number) => `L ${x} ${y}`;
const arc = (toX: number, toY: number, radius: number) =>
	`A ${radius},${radius} 0 0 0 ${toX},${toY}`;
const z = "z";

const constructClipPath = (data: ElementsRecord[string], containerSize: Bounds): string => {
	const parentBounds = {
		startX: 0,
		startY: 0,
		endX: Math.min(containerSize.width, windowWidth),
		endY: Math.min(containerSize.height, windowHeight),
	};

	switch (data.options?.mode) {
		case "circle": {
			const {
				bounds: { x, y, width, height },
				options: { padding = 0 },
			} = data;
			const radius = Math.max(width, height) / 2;
			return constructCircularPath(
				parentBounds,
				{ cx: x + width / 2, cy: y + height / 2 },
				radius + padding
			);
		}
		case "rectangle": // Fallthrough
		default: {
			const padding = data.options?.padding ?? 0;
			const borderRadius = data.options?.borderRadius ?? 0;

			const startX = data.bounds.x - padding;
			const endX = startX + data.bounds.width + padding * 2;
			const startY = data.bounds.y - padding;
			const endY = startY + data.bounds.height + padding * 2;
			return constructRectangularPath(
				parentBounds,
				{ startX, startY, endX, endY },
				borderRadius
			);
		}
	}
};

const constructRectangularPath = (
	parentBounds: ElementBounds,
	{ startX, startY, endX, endY }: ElementBounds,
	borderRadius: number
): string => {
	return [
		M(parentBounds.startX, parentBounds.startY),
		L(parentBounds.startX, parentBounds.endY),
		L(parentBounds.endX, parentBounds.endY),
		L(parentBounds.endX, parentBounds.startY),
		z,
		M(startX, startY + borderRadius),
		L(startX, endY - borderRadius),
		arc(startX + borderRadius, endY, borderRadius),
		L(endX - borderRadius, endY),
		arc(endX, endY - borderRadius, borderRadius),
		L(endX, startY + borderRadius),
		arc(endX - borderRadius, startY, borderRadius),
		L(startX + borderRadius, startY),
		arc(startX, startY + borderRadius, borderRadius),
	].join(" ");
};

const constructCircularPath = (
	parentBounds: ElementBounds,
	{ cx, cy }: { cx: number; cy: number },
	radius: number
): string => {
	return [
		M(parentBounds.startX, parentBounds.startY),
		L(parentBounds.startX, parentBounds.endY),
		L(parentBounds.endX, parentBounds.endY),
		L(parentBounds.endX, parentBounds.startY),
		z,
		M(cx, cy),
		`m ${-radius} 0`,
		`a ${radius},${radius} 0 1,0 ${radius * 2},0`,
		`a ${radius},${radius} 0 1,0 ${-radius * 2},0`,
	].join(" ");
};

export default constructClipPath;
