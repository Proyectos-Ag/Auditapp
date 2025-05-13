import { useRef, useEffect } from 'react';

export default function AutoGrowTextarea({
  value,
  onChange,
  maxHeight,
  minFontSize = 10,
  baseFontIncrement = 1,
  shrinkable = false,
  expandable = true,
  ...props
}) {
  const ref = useRef(null);
  // Guardamos el tamaño de fuente original en el primer render
  const initialFontSize = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Restablecemos altura y borramos estilo inline de fontSize para recapturar CSS
    el.style.height = 'auto';
    el.style.fontSize = initialFontSize.current ? `${initialFontSize.current}px` : '';

    // Capturamos tamaño CSS si aún no lo tenemos
    const computed = parseFloat(window.getComputedStyle(el).fontSize);
    if (initialFontSize.current === null) {
      initialFontSize.current = computed;
    }

    // Partimos siempre desde el tamaño original
    let fontSize = initialFontSize.current + (shrinkable ? baseFontIncrement : 0);
    el.style.fontSize = `${fontSize}px`;

    const scroll = el.scrollHeight;

    // Lógica de AutoGrow cuando expandable
    if (expandable) {
      if (maxHeight && scroll > maxHeight) {
        el.style.height = `${maxHeight}px`;
        el.style.overflowY = 'auto';
      } else {
        el.style.height = `${scroll}px`;
        el.style.overflowY = 'hidden';
      }
      return;
    }

    // Lógica de shrink cuando no expandable y overflow
    if (maxHeight && scroll > maxHeight) {
      el.style.height = `${maxHeight}px`;
      el.style.overflowY = 'hidden';
      while (el.scrollHeight > el.clientHeight && fontSize > minFontSize) {
        fontSize -= 1;
        el.style.fontSize = `${fontSize}px`;
      }
    } else {
      el.style.height = `${scroll}px`;
      el.style.overflowY = 'hidden';
    }
  }, [value, maxHeight, shrinkable, expandable, baseFontIncrement, minFontSize]);

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      onChange={onChange}
      rows={1}
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  );
}