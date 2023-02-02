import type { PropsWithChildren, Ref } from "react";
import React, { forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import type { HostComponent, StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { useHighlightableElements } from "./context";
import type { HighlightOptions } from "./context/context";

export type HighlightableElementProps = PropsWithChildren<{
	/**
	 * The id used by the HighlightOverlay to find this element.
	 * @since 1.0.0
	 */
	id: string;
	/**
	 * The options that decide how this element should look. If left undefined, it only highlights the element.
	 * @since 1.2.0
	 */
	options?: HighlightOptions;
	style?: StyleProp<ViewStyle>;
	removeElementManually?: boolean;
}>;

/**
 * A component that allows its children to be highlighted by the `HighlightOverlay` component.
 *
 * @since 1.0.0
 */
const HighlightableElement = forwardRef<{ removeElement: () => void }, HighlightableElementProps>(
	(
		{ id, options, children, style, removeElementManually }: HighlightableElementProps,
		highlightableElementRef: Ref<{ removeElement: () => void }>
	) => {
		const ref = useRef<View | null>(null);

		const [_, { addElement, removeElement, rootRef }] = useHighlightableElements();

		useImperativeHandle(highlightableElementRef, () => ({
			removeElement: () => {
				removeElement(id);
			},
		}));

		useEffect(() => {
			const refVal = ref.current;
			if (refVal == null || rootRef == null) {
				return;
			}

			const timeoutId = setTimeout(() => {
				ref.current?.measureLayout(
					// This is a typing error on ReactNative's part. 'rootRef' is a valid reference.
					rootRef as unknown as HostComponent<unknown>,
					(x, y, width, height) => {
						addElement(id, children, { x, y, width, height }, options);
					},
					() => {
						if (rootRef) {
							// measure relatively to root ref
							(rootRef as unknown as View).measureInWindow((rootRefX, rootRefY) => {
								ref.current?.measureInWindow((x, y, width, height) => {
									addElement(
										id,
										children,
										{ x: x - rootRefX, y: y - rootRefY, width, height },
										options
									);
								});
							});
						} else {
							ref.current?.measureInWindow((x, y, width, height) => {
								addElement(id, children, { x, y, width, height }, options);
							});
						}
					}
				);
			}, 0);

			return () => {
				clearTimeout(timeoutId);
				if (!removeElementManually) {
					removeElement(id);
				}
			};
			// We don't want to re-run this effect when addElement or removeElement changes.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [id, children, rootRef]);

		return (
			<View collapsable={false} ref={ref} style={style}>
				{children}
			</View>
		);
	}
);

export default HighlightableElement;
