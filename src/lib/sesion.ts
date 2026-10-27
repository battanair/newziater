// Se ejecuta en <head> antes de pintar: si el navegador tenía sesión iniciada, marca <html data-sesion>
// para ocultar ya lo que solo es para visitantes (clase .solo-sin-sesion). AuthProvider lo confirma después.
export const SCRIPT_SESION = `try{if(localStorage.getItem("ziater-sesion"))document.documentElement.dataset.sesion="1"}catch(e){}`;
