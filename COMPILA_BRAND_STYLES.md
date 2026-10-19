# Compila · guía visual para Codex

> Guía de referencia para crear nuevas interfaces de la marca Compila. Debe
> leerse antes de diseñar o implementar una página nueva.

**Fuente de verdad actual:** `src/app/globals.css`, `tailwind.config.ts`,
`src/app/layout.tsx` y los componentes reutilizables de `src/components/ui/`.
Esta guía documenta el sistema que existe en la web; si se modifica el
sistema base, actualiza también este archivo.

## Dirección visual

- Tema oscuro, tecnológico y humano: el fondo profundo sirve de lienzo y el
  contenido educativo debe respirar.
- Verde para acción, disponibilidad, progreso y confianza.
- Lavanda/morado para señalización, estructura, datos secundarios y acentos
  técnicos.
- Tipografía redondeada en titulares y CTAs; tipografía neutra y muy legible
  en textos largos.
- Composición editorial: pocos elementos, jerarquía clara, divisores sutiles
  y espacios amplios. No convertir cada bloque en una tarjeta.
- Las referencias a ingeniería pueden aparecer de forma discreta con
  numeración `01`, `02`, separadores, flechas y tipografía monoespaciada.
- La fotografía real de profesores y alumnos es preferible a ilustraciones
  genéricas cuando haya una imagen relevante.

## Tokens de color

### Paleta base de Tailwind

Usa estos nombres en proyectos que utilicen Tailwind. No introduzcas un nuevo
verde, morado o gris para resolver un componente sin comprobar primero estos
tokens.

| Token | Hex | Uso principal |
| --- | --- | --- |
| `compila-bg` | `#0D1117` | Fondo general, fondo del body y superficies invertidas |
| `compila-card` | `#161B22` | Tarjetas y paneles |
| `compila-elevated` | `#1F2937` | Superficie elevada, controles y estados hover oscuros |
| `compila-text` | `#F9FAFB` | Texto principal y titulares |
| `compila-muted` | `#A1A1AA` | Texto secundario y párrafos |
| `compila-dim` | `#9CA6B5` | Texto terciario, metadatos y notas |
| `compila-border` | `#30363D` | Bordes visibles de tarjetas y controles |
| `compila-green` | `#00C853` | CTA primario, enlaces activos, checks y estados positivos |
| `compila-green-hover` | `#00E676` | Hover del verde principal |
| `compila-purple` | `#7C4DFF` | Morado estructural y fondos de acento |
| `compila-lavender` | `#A78BFA` | Etiquetas, iconos, foco y texto de acento |

### Variables CSS de la landing

La landing usa además estos valores de lectura y separadores:

```css
:root {
  color-scheme: dark;
  --background: #0d1117;
  --foreground: #f4f6f8;
  --muted: #b0b9c5;
  --line: #ffffff16;
  --font-display: var(--font-nunito), system-ui, sans-serif;
  --font-body: var(--font-inter), system-ui, sans-serif;
}
```

En la landing, `--foreground` y `--muted` son ligeramente más luminosos que
los tokens Tailwind para mejorar la lectura de bloques largos. Respeta el
valor local cuando estés replicando un componente existente; para nuevos
componentes, prefiere los tokens `compila-*`.

### Acentos con transparencia

Las transparencias forman parte del estilo. Son preferibles a inventar nuevos
colores sólidos:

| Aplicación | Valor |
| --- | --- |
| Divisor estándar | `#ffffff16` (`var(--line)`) |
| Divisor visible | `#ffffff20` |
| Divisor fuerte | `#ffffff30` |
| Fondo verde suave | `#00c85312` o `#00c8530b` |
| Borde verde suave | `#00c85355` |
| Fondo morado suave | `#7c4dff12` |
| Borde morado suave | `#a78bfa66` |
| Fondo lavanda suave | `#a78bfa10` aproximadamente; en Tailwind, `bg-compila-lavender/10` |

### Superficies y gradientes

- Fondo general: `#0D1117`.
- Secciones alternas: `#11161D`, con `border-block: 1px solid var(--line)`.
- Tarjetas de precios: `#131920`, borde `#ffffff20`, radio `12px`.
- Hero: radial lavanda muy sutil en la parte superior derecha sobre el fondo.
- CTA final: radial verde sutil sobre `#101A15`, con bordes verdes de baja
  opacidad.
- No usar gradientes multicolor llamativos, glassmorphism excesivo ni sombras
  grandes en superficies que no sean flotantes.

## Tipografía

La configuración de Next carga las fuentes desde `src/app/layout.tsx`:

| Rol | Fuente | Pesos cargados | Uso |
| --- | --- | --- | --- |
| Display | Nunito | `400, 500, 600, 700, 800` | H1–H6, títulos, precios, CTAs, badges |
| Body | Inter | `400, 500, 600` | Párrafos, navegación, formularios y notas |
| Mono | `ui-monospace`, `SFMono-Regular`, `Menlo`, monospace | — | Numeración, referencias técnicas y pequeños metadatos |

Reglas de jerarquía:

- `body`: Inter, `line-height: 1.65`, antialiasing activado.
- Titulares: Nunito, peso habitual `700–800`, interlineado compacto y tracking
  negativo.
- H2 de sección: `clamp(1.9rem, 3.3vw, 2.8rem)`, peso `800`, line-height `1.15`,
  letter-spacing `-0.035em`.
- H1 del hero: `clamp(2.5rem, 4.2vw, 3.65rem)`, peso `800`, line-height `1.06`,
  letter-spacing `-0.045em`.
- El texto descriptivo suele estar entre `0.86rem` y `0.98rem`, con
  line-height `1.7–1.85` y color muted.
- Etiquetas eyebrow: `0.7rem`, peso `500`, mayúsculas, letter-spacing `0.13em`.
- Numeración técnica: `0.8rem`, mono, color lavanda.
- No usar más de tres niveles tipográficos en un mismo bloque.

## Espaciado, contenedor y radios

El contenedor compartido es:

```css
.container-page {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 20px;
}

@media (min-width: 640px) {
  .container-page { padding-inline: 32px; }
}
```

Escala práctica:

- Sección landing: `padding-block: clamp(3rem, 5vw, 4rem)`; en móvil,
  `2.75rem`.
- Sección amplia de páginas editoriales: `py-20`, `sm:py-24` y, si procede,
  `lg:py-28`.
- Separación entre título e introducción: `1rem`.
- Separación estándar entre bloques: `1rem–2rem`.
- Grid de tarjetas: `1rem`.
- Área de contenido: máximo `1200px`; texto de párrafo normalmente entre
  `540px` y `640px`.

Radios recomendados:

| Elemento | Radio |
| --- | --- |
| CTA de landing | `8px` |
| Control de navegación | `7px` |
| Tarjeta de precio / imagen | `10–12px` |
| Tarjeta genérica Tailwind | `rounded-2xl` (`1rem`) |
| Badge, chip, botón WhatsApp | `9999px` / `rounded-full` |
| Dialog | `14px` |

## Componentes y recetas

### Eyebrow y encabezado de sección

Usa el patrón `SectionHeading` de `src/components/ui/SectionHeading.tsx`:

```tsx
<SectionHeading
  number="01"
  label="Etiqueta de sección"
  title="Un titular claro y directo."
>
  Una breve explicación en muted, con un máximo aproximado de 640px.
</SectionHeading>
```

El eyebrow combina lavanda con texto muted. Los números se muestran como
`01 /`. Cuando no haya una numeración útil, omítela.

### Badges y chips

El badge estándar (`SectionBadge`) es una cápsula lavanda:

```txt
rounded-full · border-compila-lavender/30 · bg-compila-lavender/10
px-4 py-2 · Nunito bold · uppercase · tracking 0.05em
```

Para chips pequeños de asignaturas:

- Curso: `bg-compila-purple/10`, texto `compila-lavender`.
- Semestre/estado positivo: `bg-compila-green/10`, texto `compila-green`.
- Categoría neutra: `border-compila-border bg-compila-elevated`, texto claro.
- Todos: `rounded-full`, `px-2.5 py-1`, `text-xs`, Nunito semibold.

### Botones y acciones

La acción primaria es verde, compacta y con texto oscuro:

```txt
inline-flex · items-center · justify-center · gap-2
min-height: 52px · px 0.9rem · border: 1px solid compila-green
border-radius: 8px · bg compila-green · color #07150D
Inter 0.86rem / 600 · transición 180ms
```

Hover: `#1BDA6A` para los botones de la landing o
`compila-green-hover` (`#00E676`) en componentes Tailwind. En hover de
dispositivos compatibles, elevar `translateY(-2px)`; en active, `translateY(1px)`.

Las acciones de contacto usan `.contact-actions`:

- Desktop: dos columnas, gap `0.65rem`, ancho máximo `620px`.
- Tablet: pueden pasar a una columna.
- Móvil: una columna, ancho máximo `480px`, botones de al menos `48px` de alto.
- Para una variante compacta, usar `.contact-actions-compact` con máximo `385px`.

El botón WhatsApp reutilizable (`WhatsAppButton`) usa `rounded-full`, Nunito
bold y variantes `primary`, `outline` y `ghost`. Mantener siempre el anillo de
foco verde.

### Tarjetas

Receta genérica para páginas secundarias:

```txt
card = rounded-2xl border border-compila-border/80 bg-compila-card/80
card-sm = rounded-[10px] border border-compila-border/80 bg-compila-card/80
```

Las tarjetas de asignaturas llevan imagen `aspect-[16/9]`, contenido con `p-5`
y elevación mínima en hover (`translateY(-0.5px)`). Las tarjetas de precios
usan `12px` de radio y se elevan `5px` en hover con borde lavanda más visible.

### Navegación

- Header sticky, `z-index: 50`, altura aproximada `72px` en desktop y `64px`
  en móvil.
- Fondo `#0D1117F2` y `backdrop-filter: blur(16px)`.
- Línea inferior `var(--line)`.
- Enlaces desktop: Inter `0.8rem`, color `#C2C8D0`, gap `1.8rem`.
- CTA de navegación: borde blanco al `~19%`, radio `7px`, altura mínima `44px`.
- En pantallas menores de `960px`, ocultar enlaces desktop y mostrar botón de
  menú de `44px`; el menú móvil usa filas de al menos `54px`.
- La barra de progreso inferior mide `2px` y usa gradiente
  `linear-gradient(90deg, #00C853, #A78BFA)`.

### Hero

- Layout desktop en dos columnas `1.25fr / 0.85fr`.
- El mensaje principal ocupa más espacio que la fotografía.
- La especialidad o palabra clave puede ir en verde.
- El subtítulo del hero puede ser un `span` en bloque al `0.65em–0.72em` del
  titular principal.
- Oferta inicial: panel verde translúcido, borde verde `#00c85355`, radio
  `10px`, padding aproximado `1rem 1.1rem`.
- Fotografía/portraits: contenedor oscuro con borde `#ffffff20`, radio `12px`,
  fondo degradado discreto y overlay inferior para nombres.
- Ocultar el bloque fotográfico del hero en `<768px` para priorizar el CTA y la
  legibilidad.

### Secciones de beneficios, proceso y testimonios

- Beneficios: preferir grid abierto de icono + texto, no seis tarjetas.
  Desktop `3 columnas`; móvil `2`, y `1` por debajo de `360px`.
- Iconos de beneficios: `26px`, color lavanda; iconografía lineal.
- Proceso: tres pasos desktop; número mono lavanda y línea superior sutil. En
  móvil, el número queda a la izquierda del contenido.
- Testimonios: dos columnas desktop, una móvil; quote mark grande lavanda,
  línea vertical lavanda tenue y avatar circular de `38px`.
- Fundadores: composición texto + fotografía; fotos con radio `10px`, avatar
  superpuesto circular de `56px` con borde de `4px` del fondo.

### FAQ

- Usar `<details>`/`<summary>` cuando sea posible.
- Lista delimitada por líneas `#ffffff20`, sin tarjeta pesada.
- Summary: flex, mínimo aproximado `44px` de interacción, padding vertical
  `1.1rem`, texto `0.9rem` y peso `500`.
- Icono plus de `18px`, lavanda; al abrir, rotar `45deg` y teñir el summary de
  lavanda clara.

### Formularios, dialog y chat

- Dialog: fondo `#0D1117`, borde blanco al `~19%`, radio `14px`, backdrop negro
  al `~67%` con blur `5px`.
- Inputs: fondo `#161B22`, borde blanco al `~25%`, radio `8px`, padding
  `0.8rem 1rem`; focus con outline verde de `2px`.
- El chat reutiliza `compila-card`, `compila-elevated` y `compila-border`;
  mensajes del usuario en `bg-compila-green/15` y mensajes del asistente en
  `bg-compila-elevated`, ambos con radio `rounded-2xl`.
- Error: fondo rojo translúcido, borde rojo tenue y texto rojo claro. Usar el
  rojo solo para errores, no como color de marca.

### Footer

- Fondo igual al body (`#0D1117`).
- Desktop: tres columnas `1.5fr / 1fr / 0.6fr`, padding vertical `2.5rem`.
- Logo de footer de aproximadamente `98px` de ancho.
- En móvil: dos columnas para contacto/social y la marca ocupa toda la fila;
  el bloque legal pasa a columna.
- Enlaces: gris muted; hover verde.

## Iconografía y recursos

- Usar iconos SVG lineales, `currentColor`, `stroke-width: 1.7`,
  `stroke-linecap: round` y `stroke-linejoin: round`.
- Tamaño base `.icon`: `22px`; usar `16–18px` en metadatos y `20–26px` en
  acciones o beneficios.
- Iconos disponibles en `src/components/ui/Icon.tsx`: `whatsapp`, `calendar`,
  `arrow`, `check`, `person`, `pair`, `group`, `graduate`, `book`, `code`,
  `video`, `roadmap`, `plus`, `menu`, `close`.
- Logo principal: `/public/logo-removebg.webp`, utilizado por
  `src/components/ui/Logo.tsx`; no recrearlo con texto.
- Recursos de marca y fotografía: `/public/equipo/` y `/public/images/home/`.
  Mantener recortes naturales y evitar filtros fuertes.

## Responsive

Usar estos cortes, que son los de la web actual:

| Corte | Comportamiento |
| --- | --- |
| `<1024px` | Hero más compacto, CTAs apilados, padding reducido en tarjetas, fundadores en una columna |
| `<960px` | Navegación móvil; header de `64px` |
| `<768px` | Hero de una columna, se oculta la imagen del aula, grids se apilan o pasan a 2 columnas |
| `<400px` | Tipografías y padding más compactos; ajustar precios y fotos |
| `<360px` | Beneficios a una columna; ocultar iconos de la barra de contacto móvil si falta espacio |

En móvil:

- Mantener objetivos táctiles de al menos `44px`.
- No sacrificar contraste para conservar una línea en una sola fila.
- Las acciones críticas pueden quedar en una barra fija inferior de contacto;
  añadir `padding-bottom` al footer para que no tape contenido.
- Ocultar esa barra cuando el menú móvil o un dialog estén abiertos.

## Movimiento y accesibilidad

- Todas las interacciones deben seguir siendo comprensibles sin animación.
- Respetar `prefers-reduced-motion: reduce`: eliminar scroll suave, ocultar la
  barra de progreso y reducir a casi cero las transiciones/animaciones.
- Duraciones habituales: `180–200ms` para controles, `260–320ms` para feedback
  y hasta `700–950ms` solo para entradas de hero/reveal.
- Focus global: outline sólido lavanda `3px`, offset `5px`. En inputs y CTA se
  puede usar anillo verde de `2px`.
- Mantener el enlace de salto `.skip-link`, labels visibles o accesibles y
  HTML semántico (`nav`, `main`, `section`, `article`, `details`).
- El texto debe conservar contraste alto: blanco para contenido primario,
  muted para explicación y dim solo para metadatos.
- Estados `hover`, `focus-visible`, `active`, `disabled` y `open` deben ser
  distinguibles. No depender únicamente del color.

## Sombras y efectos

Tokens disponibles:

```txt
shadow-glow:   0 0 45px rgba(0, 200, 83, 0.14)
shadow-purple: 0 0 35px rgba(124, 77, 255, 0.18)
```

Usar sombras con moderación. El glow verde está reservado para CTAs o zonas
de conversión; el purple glow para un acento técnico o editorial. El header,
el chat y la barra móvil sí pueden usar blur porque son superficies flotantes.

## Reglas operativas para Codex

1. Leer este archivo y revisar `src/app/globals.css` antes de crear estilos.
2. Reutilizar `container-page`, `section-spacing`, `card`, `card-sm`, `btn`,
   `btn-primary`, `SectionHeading`, `SectionBadge`, `WhatsAppButton` e `Icon`
   cuando el proyecto use la misma base.
3. Preferir `compila-*` sobre hexadecimales nuevos. Si el componente es parte
   de la landing y necesita un valor local, reutilizar primero los valores
   documentados en “Acentos con transparencia”.
4. Mantener la combinación `Nunito + Inter`, el fondo oscuro y la jerarquía
   verde/lavanda salvo que el encargo pida explícitamente una variante de marca.
5. Antes de añadir otra tarjeta, comprobar si el contenido puede resolverse con
   una composición abierta, un divisor o una lista editorial.
6. Verificar siempre desktop, móvil, teclado, contraste y reduced motion.
7. No modificar el logo, sus proporciones ni sus colores sin una instrucción
   explícita.

## Referencias de implementación

- Tokens y componentes Tailwind: `tailwind.config.ts`.
- Reset, variables, landing, responsive, estados y animaciones:
  `src/app/globals.css`.
- Fuentes, tema y metadatos globales: `src/app/layout.tsx`.
- Logo: `src/components/ui/Logo.tsx`.
- Iconos: `src/components/ui/Icon.tsx`.
- Encabezados: `src/components/ui/SectionHeading.tsx`.
- Badges: `src/components/ui/SectionBadge.tsx`.
- CTAs WhatsApp: `src/components/ui/WhatsAppButton.tsx`.
- Navegación y footer: `src/components/layout/Navbar.tsx` y
  `src/components/layout/Footer.tsx`.
