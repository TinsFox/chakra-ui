import * as React from "react"
import {
  css,
  isStyleProp,
  StyleProps,
  SystemStyleObject,
} from "@chakra-ui/styled-system"
import { Dict, filterUndefined, objectFilter, runIfFn } from "@chakra-ui/utils"
import _styled, { CSSObject, FunctionInterpolation } from "@emotion/styled"
import { getCssResetForElement } from "@chakra-ui/css-reset"
import { shouldForwardProp } from "./should-forward-prop"
import { As, ChakraComponent, ChakraProps, PropsOf } from "./system.types"
import { DOMElements } from "./system.utils"

type StyleResolverProps = SystemStyleObject & {
  __css?: SystemStyleObject
  sx?: SystemStyleObject
  theme: any
  css?: CSSObject
}

interface GetStyleObject {
  (options: {
    baseStyle?:
      | SystemStyleObject
      | ((props: StyleResolverProps) => SystemStyleObject)
    /**
     * DOM element to apply CSS reset styles for.
     * Value should be equal to <chakra.X>, but will be possibly overridden by `as` prop.
     */
    element?: keyof JSX.IntrinsicElements
  }): FunctionInterpolation<StyleResolverProps>
}

/**
 * Style resolver function that manages how style props are merged
 * in combination with other possible ways of defining styles.
 *
 * For example, take a component defined this way:
 * ```jsx
 * <Box fontSize="24px" sx={{ fontSize: "40px" }}></Box>
 * ```
 *
 * We want to manage the priority of the styles properly to prevent unwanted
 * behaviors. Right now, the `sx` prop has the highest priority so the resolved
 * fontSize will be `40px`
 */
export const toCSSObject: GetStyleObject =
  ({ baseStyle, element }) =>
  (props) => {
    const { theme, css: cssProp, __css, sx, as = element, ...rest } = props
    const styleProps = objectFilter(rest, (_, prop) => isStyleProp(prop))
    const finalBaseStyle = runIfFn(baseStyle, props)
    const finalStyles = Object.assign(
      getCssResetForElement(as),
      __css,
      finalBaseStyle,
      filterUndefined(styleProps),
      sx,
    )
    const computedCSS = css(finalStyles)(props.theme)
    return cssProp ? [computedCSS, cssProp] : computedCSS
  }

export interface ChakraStyledOptions extends Dict {
  shouldForwardProp?(prop: string): boolean
  label?: string
  baseStyle?:
    | SystemStyleObject
    | ((props: StyleResolverProps) => SystemStyleObject)
}

export function styled<T extends As, P = {}>(
  component: T,
  options?: ChakraStyledOptions,
) {
  const { baseStyle, ...styledOptions } = options ?? {}

  if (!styledOptions.shouldForwardProp) {
    styledOptions.shouldForwardProp = shouldForwardProp
  }

  const styleObject = toCSSObject({
    baseStyle,
    element: String(component) as keyof JSX.IntrinsicElements,
  })
  return _styled(
    component as React.ComponentType<any>,
    styledOptions,
  )(styleObject) as ChakraComponent<T, P>
}

export type HTMLChakraComponents = {
  [Tag in DOMElements]: ChakraComponent<Tag, {}>
}

export type HTMLChakraProps<T extends As> = Omit<
  PropsOf<T>,
  "ref" | keyof StyleProps
> &
  ChakraProps & { as?: As }
