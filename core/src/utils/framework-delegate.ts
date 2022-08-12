import type { ComponentRef, FrameworkDelegate } from '../interface';

import { componentOnReady } from './helpers';

export const attachComponent = async (
  delegate: FrameworkDelegate | undefined,
  container: Element,
  component?: ComponentRef,
  componentProps?: { [key: string]: any },
  inline?: boolean,
  cssClasses?: string[],
): Promise<HTMLElement> => {
  if (delegate) {
    return delegate.attachViewToDom(container, component, componentProps, cssClasses);
  }
  if (!inline && typeof component !== 'string' && !(component instanceof HTMLElement)) {
    throw new Error('framework delegate is missing');
  }

  const el: any = typeof component === 'string' ? container.ownerDocument?.createElement(component) : component;

  if (cssClasses) {
    cssClasses.forEach((c) => el.classList.add(c));
  }
  if (componentProps) {
    Object.assign(el, componentProps);
  }

  container.appendChild(el);

  await new Promise((resolve) => componentOnReady(el, resolve));

  return el;
};

export const detachComponent = (delegate: FrameworkDelegate | undefined, element: HTMLElement | undefined) => {
  if (element) {
    if (delegate) {
      const container = element.parentElement;
      return delegate.removeViewFromDom(container, element);
    }
    element.remove();
  }
  return Promise.resolve();
};

export const CoreDelegate = () => {
  let BaseComponent: any;
  let Reference: any;
  const attachViewToDom = async (
    parentElement: HTMLElement,
    userComponent: any,
    userComponentProps: any = {},
    cssClasses: string[] = []
  ) => {
    BaseComponent = parentElement;
    /**
     * If passing in a component via the `component` props
     * we need to append it inside of our overlay component.
     */
    if (userComponent) {
      /**
       * If passing in the tag name, create
       * the element otherwise just get a reference
       * to the component.
       */
      const el: any =
        typeof userComponent === 'string' ? BaseComponent.ownerDocument?.createElement(userComponent) : userComponent;

      /**
       * Add any css classes passed in
       * via the cssClasses prop on the overlay.
       */
      cssClasses.forEach((c) => el.classList.add(c));

      /**
       * Add any props passed in
       * via the componentProps prop on the overlay.
       */
      Object.assign(el, userComponentProps);

      /**
       * Finally, append the component
       * inside of the overlay component.
       */
      BaseComponent.appendChild(el);

      await new Promise((resolve) => componentOnReady(el, resolve));
    } else if (BaseComponent.children.length > 0) {
      // If there is no component, then we need to create a new parent
      // element to apply the css classes to.
      // const el = BaseComponent.ownerDocument?.createElement('div');
      // cssClasses.forEach((c) => el.classList.add(c));
      // // Move each child from the original template to the new parent element.
      // el.append(...BaseComponent.children);
      // // Append the new parent element to the original parent element.
      // BaseComponent.appendChild(el);
    }

    /**
     * Get the root of the app and
     * add the overlay there.
     */
    const app = document.querySelector('gasco-app') || document.body;

    /**
     * Create a placeholder comment so that
     * we can return this component to where
     * it was previously.
     */
    Reference = document.createComment('gasco teleport');
    BaseComponent.parentNode.insertBefore(Reference, BaseComponent);

    app.appendChild(BaseComponent);

    return BaseComponent;
  };

  const removeViewFromDom = () => {
    /**
     * Return component to where it was previously in the DOM.
     */
    if (BaseComponent && Reference) {
      Reference.parentNode.insertBefore(BaseComponent, Reference);
      Reference.remove();
    }
    return Promise.resolve();
  };

  return { attachViewToDom, removeViewFromDom };
};
