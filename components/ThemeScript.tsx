// 无闪烁主题脚本：在 <body> 最前面同步执行，
// 根据 localStorage('theme') 或系统偏好给 <html> 加上 .dark，避免首屏闪烁。
export function ThemeScript() {
  const script = `(function(){try{var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&d)){document.documentElement.classList.add('dark');}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
