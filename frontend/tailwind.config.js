/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Fundo "gelo" com leve tom de folha: menos ofuscante que branco puro sob o sol.
        gelo: {
          DEFAULT: '#EEF3EF',
          escuro: '#E0E9E3', // hover sobre o gelo
          borda: '#C9D6CD', // divisória do menu lateral
        },
        // Texto principal: quase preto, contraste ~17:1 sobre o gelo.
        tinta: '#14201A',
      },
      fontFamily: {
        // Atkinson Hyperlegible: desenhada para leitura com baixa visão.
        sans: ['"Atkinson Hyperlegible"', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
        // Nunito: títulos arredondados, tom acolhedor.
        titulo: ['Nunito', 'ui-rounded', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
