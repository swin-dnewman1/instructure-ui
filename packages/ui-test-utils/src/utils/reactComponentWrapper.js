/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 - present Instructure, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

class ReactComponentWrapper {
  mount (element, options = {}) {
    this.unmount()

    const { type, ref, props } = element
    const Wrapper = createMountWrapper(element, options)

    this._mountNode = document.createElement('div')
    this._mountNode.setAttribute('data-ui-test-utils', 'true')
    document.body.appendChild(this._mountNode)

    return new Promise((resolve, reject) => {
      let wrapper, resolved
      try {
        ReactDOM.render(
          React.createElement(Wrapper, {
            Component: type,
            props: { ...props, ...options.props },
            context: options.context,
            ref: (el) => {
              wrapper = el
              if (wrapper && !resolved) {
                resolve({
                  setProps (newProps) {
                    return wrapper.setChildProps(newProps)
                  },
                  setContext (newContext)  {
                    return wrapper.setChildContext(newContext)
                  },
                  getDOMNode () {
                    return wrapper.getDOMNode()
                  }
                })
                resolved = true
              }
              if (typeof ref === 'function') {
                ref(el)
              }
            }
          }),
          this._mountNode
        )
      } catch (err) {
        reject(err)
      }
    })
  }

  unmount () {
    let result
    if (this._mountNode) {
      result = ReactDOM.unmountComponentAtNode(this._mountNode)
      this._mountNode && this._mountNode.remove()
    }
    return result
  }
}

function createMountWrapper (element, options = {}) {
  class WrapperComponent extends React.Component {
    static propTypes = {
      Component: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      props: PropTypes.object.isRequired,
      context: PropTypes.object
    }

    static defaultProps = {
      context: {}
    }

    constructor (...args) {
      super(...args)
      const { props, context } = this.props
      this.state = {
        mount: true,
        props,
        context
      }
    }

    getDOMNode () {
      return ReactDOM.findDOMNode(this)
    }

    setChildProps (newProps) {
      const { props: oldProps } = this.state
      const props = { ...oldProps, ...newProps }
      return new Promise(resolve => this.setState({ props }, resolve))
    }

    setChildContext (newContext) {
      const { context: oldContext } = this.state
      const context = { ...oldContext, ...newContext }
      return new Promise(resolve => this.setState({ context }, resolve))
    }

    render () {
      const { Component } = this.props
      const { mount, props } = this.state

      const {
        componentRef,
        ...componentProps
      } = props

      if (!mount) return null

      return (
        <Component ref={componentRef} {...componentProps} />
      )
    }
  }

  if (element.type.contextTypes) {
    const childContextTypes = {
      ...element.type.contextTypes
    }

    WrapperComponent.prototype.getChildContext = function getChildContext () {
      return this.state.context
    }
    WrapperComponent.childContextTypes = childContextTypes
  }

  return WrapperComponent
}

export default new ReactComponentWrapper()
