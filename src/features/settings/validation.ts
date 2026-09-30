/** Avatar, logo and similar fields: empty, or an http(s) URL (the server checks the same). */
export const validUrl = (v: string) => !v.trim() || /^https?:\/\/\S+$/i.test(v.trim()) || "Use an http(s) URL";
