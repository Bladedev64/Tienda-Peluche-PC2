/* ==========================================================
   Plumón & Co. — Lógica compartida (5 páginas)
   ========================================================== */

(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const eur = n => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

  /* ---------------- Productos ---------------- */
  const PRODUCTOS = [
    { id: 1, nombre: "Oso Bruno", emoji: "❤️", cat: "Animales", precio: 34.90, stock: 12, desc: "El clásico de la casa, suave y con orejas que no se caen." },
    { id: 2, nombre: "Conejo Algodón", emoji: "🔥", cat: "Animales", precio: 27.50, stock: 20, desc: "Orejas larguísimas y pelaje de algodón peinado." },
    { id: 3, nombre: "Gato Bigotes", emoji: "👍", cat: "Animales", precio: 31.00, stock: 8, desc: "Detalle en fieltro para los bigotes. Ronronea si le aprietas." },
    { id: 4, nombre: "Elefante Trompa", emoji: "🥰", cat: "Animales", precio: 45.00, stock: 5, desc: "Trompa enrollable y mucho peso para tus brazos." },
    { id: 5, nombre: "Unicornio", emoji: "😂", cat: "Fantasía", precio: 39.90, stock: 14, desc: "Crin plateada y un cuerno que brilla en la oscuridad." },
    { id: 6, nombre: "Pato Rubí", emoji: "😀", cat: "Colección", precio: 24.50, stock: 17, desc: "El patito de goma suave, ideal para la bañera." },
    { id: 7, nombre: "Zorrito Naranja", emoji: "🦊", cat: "Animales", precio: 29.90, stock: 10, desc: "Un zorrito suave y esponjoso, perfecto para abrazar." }
  ];

  /* ---------------- Carrito (compartido entre páginas) ---------------- */
  const KEY = "plumon_carrito";
  let carrito = [];

  try {
    carrito = JSON.parse(localStorage.getItem(KEY)) || [];
  } catch (_) {}

  function guardar() {
    try {
      localStorage.setItem(KEY, JSON.stringify(carrito));
    } catch (_) {}
    pintarContador();
  }

  const total = () => carrito.reduce((a, i) => a + i.precio * i.cantidad, 0);

  function pintarContador() {
    const n = carrito.reduce((a, i) => a + i.cantidad, 0);
    const el = $("#contador");
    if (el) el.textContent = n;
  }

  /* ---------------- Aviso flotante ---------------- */
  let timer;

  function aviso(texto, ok = true) {
    const el = $("#toast");
    if (!el) return;

    el.textContent = texto;
    el.className = "toast " + (ok ? "ok" : "err");

    clearTimeout(timer);
    timer = setTimeout(() => {
      el.className = "toast";
      el.textContent = "";
    }, 3000);
  }

  /* ---------------- Validación simple ---------------- */
  const emailValido = v => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());

  function error(campo, texto) {
    const input = $("#" + campo);
    const caja = input ? input.closest(".campo, .form__row, form") : null;
    const div = document.querySelector('[data-error="' + campo + '"]');

    if (input) {
      input.classList.toggle("bad", !!texto);
      input.setAttribute("aria-invalid", texto ? "true" : "false");
    }

    if (div) div.textContent = texto || "";
    if (caja && caja.classList.contains("campo")) {
      caja.classList.toggle("has-error", !!texto);
    }

    return !texto;
  }

  function limpiarErrores(form) {
    $$(".error", form).forEach(e => (e.textContent = ""));
    $$(".bad", form).forEach(e => e.classList.remove("bad"));
    $$(".has-error", form).forEach(e => e.classList.remove("has-error"));
  }

  /* ---------------- Pintar productos ---------------- */
  function tarjeta(p) {
    const agotado = p.stock === 0;

    return `<article class="plush">
      <div class="plush__emoji">${p.emoji}</div>
      <h3>${p.nombre}</h3>
      <p>${p.desc}</p>
      <div class="plush__price">${eur(p.precio)}</div>
      <button class="btn btn--small" data-add="${p.id}" ${agotado ? "disabled" : ""}>
        ${agotado ? "Agotado" : "Añadir al carrito"}
      </button>
    </article>`;
  }

  const lista = $("#productos");

  if (lista) {
    lista.innerHTML = PRODUCTOS.map(tarjeta).join("");

    const info = $("#resultado");
    if (info) info.textContent = PRODUCTOS.length + " peluches disponibles";
  }

  const destacados = $("#destacados");

  if (destacados) {
    destacados.innerHTML = PRODUCTOS.slice(0, 4).map(tarjeta).join("");
  }

  /* ---------------- Filtro del catálogo ---------------- */
  const formFiltro = $("#form-filtro");

  if (formFiltro) {
    const pintar = () => {
      const q = $("#buscar").value.trim().toLowerCase();
      const cat = $("#categoria").value;

      const res = PRODUCTOS.filter(p =>
        (!q || (p.nombre + " " + p.desc).toLowerCase().includes(q)) &&
        (!cat || p.cat === cat)
      );

      $("#productos").innerHTML = res.length
        ? res.map(tarjeta).join("")
        : '<p style="color:#6f6165">No hay peluches con esos filtros.</p>';

      const info = $("#resultado");
      if (info) info.textContent = res.length + " peluches encontrados";
    };

    formFiltro.addEventListener("submit", e => {
      e.preventDefault();
      limpiarErrores(formFiltro);

      const q = $("#buscar").value.trim();

      if (q.length > 40) {
        return error("buscar", "Máximo 40 caracteres.");
      }

      pintar();
      aviso("Búsqueda actualizada.");
    });

    $("#categoria").addEventListener("change", pintar);
    $("#limpiar").addEventListener("click", () => setTimeout(pintar, 0));
  }

  /* ---------------- Añadir al carrito ---------------- */
  document.addEventListener("click", e => {
    const add = e.target.closest("[data-add]");

    if (add) {
      const p = PRODUCTOS.find(x => x.id === Number(add.dataset.add));

      if (p) {
        const item = carrito.find(i => i.nombre === p.nombre);

        if (item) {
          item.cantidad++;
        } else {
          carrito.push({
            nombre: p.nombre,
            emoji: p.emoji,
            precio: p.precio,
            cantidad: 1
          });
        }

        guardar();
        aviso(p.nombre + " añadido al carrito.");
      }

      return;
    }

    const del = e.target.closest("[data-quitar]");

    if (del) {
      carrito.splice(Number(del.dataset.quitar), 1);
      guardar();
      pintarCarrito();
      aviso("Producto eliminado.");
    }
  });

  /* ---------------- Página del carrito ---------------- */
  function pintarCarrito() {
    const cont = $("#carrito-items");
    if (!cont) return;

    if (!carrito.length) {
      cont.innerHTML = '<li style="border:none">Tu carrito está vacío. <a href="catalogo.html">Ver el catálogo</a></li>';
    } else {
      cont.innerHTML = carrito.map((i, idx) => `
        <li>
          <span class="emoji">${i.emoji}</span>
          <span>
            <span class="name">${i.nombre}</span><br>
            <span class="meta">${i.cantidad} ud. · ${eur(i.precio)}/ud.</span>
          </span>
          <span class="price">${eur(i.precio * i.cantidad)}</span>
          <button type="button" data-quitar="${idx}">Quitar</button>
        </li>`).join("");
    }

    const t = $("#total");
    if (t) t.textContent = "Total: " + eur(total());
  }

  const vaciar = $("#vaciar");

  if (vaciar) {
    vaciar.addEventListener("click", () => {
      carrito = [];
      guardar();
      pintarCarrito();
      aviso("Carrito vaciado.");
    });
  }

  /* ---------------- Formularios ---------------- */

  /* 1 · Inicio — suscripción al boletín */
  const fBoletin = $("#form-boletin");

  if (fBoletin) {
    fBoletin.addEventListener("submit", e => {
      e.preventDefault();
      limpiarErrores(fBoletin);

      const mail = $("#boletin-mail").value.trim();

      if (!emailValido(mail)) {
        error("boletin-mail", "Escribe un correo válido.");
        return aviso("Revisa el correo.", false);
      }

      fBoletin.reset();
      aviso("¡Suscripción hecha! Te damos un 10% en tu primera compra.");
    });
  }

  /* 2 · Catálogo — filtros (validado arriba) */

  /* 3 · Carrito — datos de envío */
  const fEnvio = $("#form-envio");

  if (fEnvio) {
    fEnvio.addEventListener("submit", e => {
      e.preventDefault();
      limpiarErrores(fEnvio);

      let ok = true;

      if (!$("#envio-nombre").value.trim()) {
        error("envio-nombre", "Escribe tu nombre.");
        ok = false;
      }

      if (!emailValido($("#envio-email").value)) {
        error("envio-email", "Correo no válido.");
        ok = false;
      }

      if (!$("#envio-dir").value.trim()) {
        error("envio-dir", "Escribe tu dirección.");
        ok = false;
      }

      if (!$("#envio-ciudad").value.trim()) {
        error("envio-ciudad", "Escribe tu ciudad.");
        ok = false;
      }

      if (!/^\d{5}$/.test($("#envio-cp").value.trim())) {
        error("envio-cp", "5 dígitos.");
        ok = false;
      }

      if (!ok) return aviso("Faltan datos por completar.", false);
      if (!carrito.length) return aviso("El carrito está vacío.", false);

      const n = "PLM-" + Math.random().toString(36).slice(2, 7).toUpperCase();

      aviso("¡Pedido " + n + " confirmado! Total " + eur(total()));

      carrito = [];
      guardar();
      pintarCarrito();
      fEnvio.reset();
    });
  }

  /* 4 · Nosotros — reseña */
  const fResena = $("#form-resena");

  if (fResena) {
    fResena.addEventListener("submit", e => {
      e.preventDefault();
      limpiarErrores(fResena);

      let ok = true;

      if (!$("#resena-nombre").value.trim()) {
        error("resena-nombre", "Escribe tu nombre.");
        ok = false;
      }

      if (!emailValido($("#resena-email").value)) {
        error("resena-email", "Correo no válido.");
        ok = false;
      }

      if (!$("#resena-producto").value) {
        error("resena-producto", "Elige un peluche.");
        ok = false;
      }

      const estrellas = $("input[name='estrellas']:checked");

      if (!estrellas) {
        error("estrellas", "Elige una puntuación.");
        ok = false;
      }

      if ($("#resena-texto").value.trim().length < 15) {
        error("resena-texto", "Escribe al menos 15 caracteres.");
        ok = false;
      }

      if (!$("#resena-ok").checked) {
        error("resena-ok", "Necesitamos tu permiso.");
        ok = false;
      }

      if (!ok) return aviso("Revisa los campos marcados.", false);

      const lista = $("#resenas");

      if (lista) {
        const art = document.createElement("article");
        art.className = "card";

        art.innerHTML = `<h3>${$("#resena-producto").value}</h3>
          <p style="color:#f5a623">${"★".repeat(Number(estrellas.value))}${"☆".repeat(5 - Number(estrellas.value))}</p>
          <p>${$("#resena-texto").value.trim()}</p>
          <small>— ${$("#resena-nombre").value.trim()}</small>`;

        lista.prepend(art);
      }

      fResena.reset();
      aviso("¡Gracias por tu reseña!");
    });
  }

  /* 5 · Contacto — mensaje */
  const fContacto = $("#form-contacto");

  if (fContacto) {
    fContacto.addEventListener("submit", e => {
      e.preventDefault();
      limpiarErrores(fContacto);

      let ok = true;

      if (!$("#contacto-nombre").value.trim()) {
        error("contacto-nombre", "Escribe tu nombre.");
        ok = false;
      }

      if (!emailValido($("#contacto-email").value)) {
        error("contacto-email", "Correo no válido.");
        ok = false;
      }

      if (!$("#contacto-asunto").value) {
        error("contacto-asunto", "Elige un asunto.");
        ok = false;
      }

      if ($("#contacto-mensaje").value.trim().length < 15) {
        error("contacto-mensaje", "Mínimo 15 caracteres.");
        ok = false;
      }

      if (!$("#contacto-ok").checked) {
        error("contacto-ok", "Debes aceptar la política de privacidad.");
        ok = false;
      }

      if (!ok) return aviso("Revisa los campos marcados.", false);

      fContacto.reset();
      aviso("Mensaje enviado. Te respondemos en menos de 24 h.");
    });
  }

  /* ---------------- Inicio ---------------- */
  pintarContador();
  pintarCarrito();

  const anio = $("#anio");
  if (anio) anio.textContent = new Date().getFullYear();

})();