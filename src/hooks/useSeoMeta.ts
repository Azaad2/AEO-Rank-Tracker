import { useEffect } from "react";
interface SeoMetaOptions {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
  schemaId?: string;
}

export function useSeoMeta({
  title,
  description,
  canonical,
  ogImage,
  schema,
  noindex = false,
  schemaId = "page-schema",
}: SeoMetaOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (selector: string, attrName: string, attrValue: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      const prev = el.getAttribute("content") || "";
      el.setAttribute("content", content);
      return () => el!.setAttribute("content", prev);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      let created = false;
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
        created = true;
      }
      const prev = el.getAttribute("href") || "";
      el.href = href;
      return () => { if (created) el!.remove(); else el!.href = prev; };
    };

    const fns: (() => void)[] = [];
    fns.push(setMeta('meta[name="description"]', "name", "description", description));
    if (noindex) fns.push(setMeta('meta[name="robots"]', "name", "robots", "noindex, nofollow"));
    const resolvedCanonical = canonical || window.location.href.split("?")[0];
    fns.push(setLink("canonical", resolvedCanonical));
    fns.push(setMeta('meta[property="og:title"]', "property", "og:title", title));
    fns.push(setMeta('meta[property="og:description"]', "property", "og:description", description));
    fns.push(setMeta('meta[property="og:url"]', "property", "og:url", resolvedCanonical));
    if (ogImage) fns.push(setMeta('meta[property="og:image"]', "property", "og:image", ogImage));
    fns.push(setMeta('meta[name="twitter:title"]', "name", "twitter:title", title));
    fns.push(setMeta('meta[name="twitter:description"]', "name", "twitter:description", description));

    if (schema) {
      document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove());
      const script = document.createElement("script");
      script.id = schemaId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      fns.forEach((fn) => fn());
      document.getElementById(schemaId)?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonical, noindex, schemaId]);
}

export default useSeoMeta;
