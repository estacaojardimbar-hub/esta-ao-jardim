# Estação Jardim — Site estático

Pequeno projeto front-end do Bar Estação Jardim. Contém um esqueleto SPA simples com navegação, reserva via WhatsApp e estilos responsivos.

O que já foi feito
- Estrutura de arquivos: `index.html.html`, `css/styles.css`, `js/app.js`
- Navegação (sidebar + nav móvel)
- Fluxo de reserva que abre WhatsApp com mensagem pré-preenchida

Como usar localmente
1. Coloque o logo em `assets/logo.svg` ou substitua por `assets/logo.png`.
2. Abra um servidor local na pasta do projeto. Exemplo com Python:

```powershell
python -m http.server 8000
```

3. Abra `http://localhost:8000/index.html.html` no navegador.

Configurar WhatsApp
- O número padrão está em `js/app.js` (variável `tel` dentro de `wpp`). Já atualizei para `+55 11 94719-6813`.

Próximos passos recomendados
- Finalizar identidade visual (cores, tipografia e aplicação do logo)
- Adicionar página de Cardápio e fluxo de pedidos
- Integrar backend para persistência de reservas (opcional)
- Testes, acessibilidade e README mais completo

Se quiser, eu já faço:
- ajustar a identidade visual aplicando o logo e refinando CSS
- criar um fluxo de cardápio com seleção de itens
- adicionar um pequeno backend leve para reservas
