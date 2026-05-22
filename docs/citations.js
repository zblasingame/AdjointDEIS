/* ───────────────────────────────────────────────────────────────────
   citations.js — resolves <span class="cite" data-key="…"></span>
   into numbered author-year citations + an auto-built References
   section with back-references.

   Ported from dimblog / greedydimblog, with the bib trimmed to the
   keys referenced on the AdjointDEIS landing page.
   ─────────────────────────────────────────────────────────────────── */
(function(){
  const C = {
    // ─── adjoint sensitivity / neural ODEs ───
    'pontryagin':        {authors:'Boltyanskii, V. G., Gamkrelidze, R. V., Pontryagin, L. S.', title:'On the Theory of Optimal Processes', venue:'Doklady Akademii Nauk SSSR', year:1956, url:'https://www.mathnet.ru/eng/dan9286'},
    'neuralode':         {authors:'Chen, R. T. Q., Rubanova, Y., Bettencourt, J., Duvenaud, D.', title:'Neural Ordinary Differential Equations', venue:'NeurIPS', year:2018, url:'https://arxiv.org/abs/1806.07366'},
    'adjointdpm':        {authors:'Pan, J., Yan, S., Liew, J. H., Feng, J., Ng, V. Y.', title:'AdjointDPM: Adjoint Sensitivity Method for Gradient Backpropagation of Diffusion Probabilistic Models', venue:'ICLR', year:2024, url:'https://arxiv.org/abs/2307.10711'},
    'kidger':            {authors:'Kidger, P.', title:'On Neural Differential Equations', venue:'PhD thesis, Oxford', year:2022, url:'https://arxiv.org/abs/2202.02435'},

    // ─── diffusion theory / solvers ───
    'song2021':          {authors:'Song, Y., Sohl-Dickstein, J., Kingma, D. P., Kumar, A., Ermon, S., Poole, B.', title:'Score-Based Generative Modeling through Stochastic Differential Equations', venue:'ICLR', year:2021, url:'https://arxiv.org/abs/2011.13456'},
    'dpmsolver':         {authors:'Lu, C., Zhou, Y., Bao, F., Chen, J., Li, C., Zhu, J.', title:'DPM-Solver: A Fast ODE Solver for Diffusion Probabilistic Model Sampling in Around 10 Steps', venue:'NeurIPS', year:2022, url:'https://arxiv.org/abs/2206.00927'},
    'deis':              {authors:'Zhang, Q., Chen, Y.', title:'Fast Sampling of Diffusion Models with Exponential Integrator', venue:'ICLR', year:2023, url:'https://arxiv.org/abs/2204.13902'},
    'cyclediffusion':    {authors:'Wu, C. H., De la Torre, F.', title:'A Latent Space of Stochastic Diffusion Models for Zero-Shot Image Editing and Guidance (CycleDiffusion)', venue:'ICCV', year:2023, url:'https://arxiv.org/abs/2210.05559'},

    // ─── guided generation ───
    'dps':               {authors:'Chung, H., Kim, J., McCann, M. T., Klasky, M. L., Ye, J. C.', title:'Diffusion Posterior Sampling for General Noisy Inverse Problems', venue:'ICLR', year:2023, url:'https://arxiv.org/abs/2209.14687'},
    'mpgd':              {authors:'He, Y., Murata, N., Lai, C.-H., et al.', title:'Manifold Preserving Guided Diffusion (MPGD)', venue:'ICLR', year:2024, url:'https://arxiv.org/abs/2311.16424'},
    'freedom':           {authors:'Yu, J., Wang, Y., Zhao, C., Ghanem, B., Zhang, J.', title:'FreeDoM: Training-Free Energy-Guided Conditional Diffusion Model', venue:'ICCV', year:2023, url:'https://arxiv.org/abs/2303.09833'},
    'doodl':             {authors:'Wallace, B., Gokul, A., Ermon, S., Naik, N.', title:'End-to-End Diffusion Latent Optimization Improves Classifier Guidance (DOODL)', venue:'ICCV', year:2023, url:'https://arxiv.org/abs/2303.13703'},

    // ─── face morphing / FR ───
    'dim':               {authors:'Blasingame, Z. W., Liu, C.', title:'Leveraging Diffusion for Strong and High-Quality Face Morphing Attacks', venue:'IEEE T-BIOM 6(1)', year:2024, url:'https://arxiv.org/abs/2301.04218'},
    'fastdim':           {authors:'Blasingame, Z. W., Liu, C.', title:'Fast-DiM: Towards Fast Diffusion Morphs', venue:'IEEE Security &amp; Privacy 22(4)', year:2024, url:'https://arxiv.org/abs/2310.09484'},
    'morphpipe':         {authors:'Zhang, H., Venkatesh, S., Ramachandra, R., Raja, K., Damer, N., Busch, C.', title:'Morph-PIPE: Plugging in Identity Prior to Enhance Face Morphing Attack Based on Diffusion Model', venue:'NIST IBPC', year:2024, url:'https://arxiv.org/abs/2309.01999'},
    'arcface':           {authors:'Deng, J., Guo, J., Xue, N., Zafeiriou, S.', title:'ArcFace: Additive Angular Margin Loss for Deep Face Recognition', venue:'CVPR', year:2019, url:'https://arxiv.org/abs/1801.07698'},
    'adaface':           {authors:'Kim, M., Jain, A. K., Liu, X.', title:'AdaFace: Quality Adaptive Margin for Face Recognition', venue:'CVPR', year:2022, url:'https://arxiv.org/abs/2204.00964'},
    'elasticface':       {authors:'Boutros, F., Damer, N., Kirchbuchner, F., Kuijper, A.', title:'ElasticFace: Elastic Margin Loss for Deep Face Recognition', venue:'CVPRW', year:2022, url:'https://arxiv.org/abs/2109.09416'},

    // ─── follow-up ───
    'greedydim':         {authors:'Blasingame, Z. W., Liu, C.', title:'Greedy-DiM: Greedy Algorithms for Unreasonably Effective Face Morphs', venue:'IJCB', year:2024, url:'https://arxiv.org/abs/2404.06025'},
    'greed_is_good':     {authors:'Blasingame, Z. W., Liu, C.', title:'Greed is Good: Guided Generation from a Greedy Perspective', venue:'NeurIPS', year:2025, url:'https://arxiv.org/abs/2502.08006'},

    // ─── reversible solvers (alternative to DTO) ───
    'kidger2021efficient': {authors:'Kidger, P., Foster, J., Li, X. C., Lyons, T.', title:'Efficient and Accurate Gradients for Neural SDEs', venue:'NeurIPS', year:2021, url:'https://arxiv.org/abs/2105.13493'},
    'zhuang2021mali':      {authors:'Zhuang, J., Dvornek, N., Tatikonda, S., Duncan, J.', title:'MALI: A memory-efficient and reverse-accurate integrator for neural ODEs', venue:'ICLR', year:2021, url:'https://openreview.net/forum?id=blfSjHeFM_e'},
    'mccallum2024foster':  {authors:'McCallum, S., Foster, J.', title:'Efficient, Accurate and Stable Gradients for Neural ODEs', venue:'arXiv:2410.11648', year:2024, url:'https://arxiv.org/abs/2410.11648'},
    'rex':                 {authors:'Blasingame, Z. W., Liu, C.', title:'Rex: A Family of Reversible Exponential (Stochastic) Runge&ndash;Kutta Solvers', venue:'ICML', year:2026, url:'https://arxiv.org/abs/2502.08834'},
  };

  /* ─── Sidenote (footnote) markup ─────────────────────────────── */
  let snCounter = 0;
  function makeNote(html){
    snCounter += 1;
    const id = 'sn-' + snCounter;
    const sup  = '<label class="margin-toggle-label" for="' + id + '"><sup class="sidenote-number"></sup></label>';
    const cb   = '<input type="checkbox" id="' + id + '" class="margin-toggle">';
    const note = '<span class="sidenote">' + html + '</span>';
    return sup + cb + note;
  }

  /* ─── Author-year formatting helpers ─────────────────────────── */
  function parseSurnames(s){
    if(!s) return [];
    const parts = s.split(',').map(t => t.trim()).filter(Boolean);
    const out = [];
    for(const p of parts){
      if(/^et\s+al\.?$/i.test(p)) { out.push('et al.'); continue; }
      if(/^([A-Z]\.?\s*\-?\s*)+$/.test(p)) continue;
      out.push(p);
    }
    return out;
  }
  function shortAuthors(s){
    const sur = parseSurnames(s);
    if(!sur.length) return '';
    if(sur.length === 1) return sur[0];
    if(sur[1] === 'et al.') return sur[0] + ' et al.';
    if(sur.length === 2)   return sur[0] + ' and ' + sur[1];
    return sur[0] + ' et al.';
  }

  /* ─── Bibliography entry formatting ──────────────────────────── */
  function fmtBibEntry(key){
    const c = C[key];
    if(!c) return '<em>[missing: ' + key + ']</em>';
    let s = '';
    if(c.authors) s += c.authors;
    if(c.year)    s += ' (' + c.year + ').';
    if(c.title){
      s += ' <em>' + c.title + '</em>';
      if(!/[.!?]$/.test(c.title)) s += '.';
    }
    if(c.venue) s += ' ' + c.venue + '.';
    if(c.url)       s += ' <a href="' + c.url + '">link</a>';
    else if(c.doi)  s += ' <a href="https://doi.org/' + c.doi + '">doi</a>';
    return s;
  }

  /* ─── Main pass ──────────────────────────────────────────────── */
  function process(){
    const cited = Object.create(null);
    let siteCounter = 0;

    document.querySelectorAll('.cite').forEach(el => {
      const keys = (el.getAttribute('data-key') || '').split(',').map(s => s.trim()).filter(Boolean);
      if(!keys.length){ el.remove(); return; }
      const style = (el.getAttribute('data-style') || 'parenthetical').toLowerCase();

      siteCounter += 1;
      const siteId = 'cite-' + siteCounter;

      const parts = keys.map(k => {
        const c = C[k];
        if(!c){
          return '<span class="cite-missing">[missing: ' + k + ']</span>';
        }
        (cited[k] = cited[k] || []).push({id: siteId, idx: siteCounter});
        const auth = shortAuthors(c.authors);
        const year = c.year || 'n.d.';
        const href = '#bib-' + cssEscape(k);
        if(style === 'year' && keys.length === 1){
          return '<a href="' + href + '" class="cite-link">(' + year + ')</a>';
        }
        if(style === 'narrative' && keys.length === 1){
          return '<a href="' + href + '" class="cite-link">' + auth + '</a>\u202F(' + year + ')';
        }
        return '<a href="' + href + '" class="cite-link">' + auth + ', ' + year + '</a>';
      });

      let inner;
      if((style === 'narrative' || style === 'year') && keys.length === 1){
        inner = parts[0];
      } else {
        inner = '(' + parts.join('; ') + ')';
      }
      const html = '<span class="cite-inline" id="' + siteId + '">' + inner + '</span>';

      const tmp = document.createElement('span');
      tmp.innerHTML = html;
      const node = tmp.firstChild;

      const prev = el.previousSibling;
      const needSpace = prev && prev.nodeType === Node.TEXT_NODE && !/\s$/.test(prev.nodeValue)
                      || prev && prev.nodeType === Node.ELEMENT_NODE;
      el.replaceWith(node);
      if(needSpace){
        node.parentNode.insertBefore(document.createTextNode(' '), node);
      }
    });

    document.querySelectorAll('.footnote').forEach(el => {
      const html = el.innerHTML;
      const wrap = document.createElement('span');
      wrap.innerHTML = makeNote(html);
      el.replaceWith(wrap);
    });

    document.querySelectorAll('.margin').forEach(el => {
      el.classList.remove('margin');
      el.classList.add('marginnote');
    });

    buildBibliography(cited);
  }

  function buildBibliography(cited){
    const keys = Object.keys(cited);
    if(!keys.length) return;

    keys.sort((a, b) => {
      const A = (parseSurnames((C[a]||{}).authors)[0] || a).toLowerCase();
      const B = (parseSurnames((C[b]||{}).authors)[0] || b).toLowerCase();
      if(A < B) return -1;
      if(A > B) return  1;
      const yA = (C[a]||{}).year || 0;
      const yB = (C[b]||{}).year || 0;
      return yA - yB;
    });

    let host = document.getElementById('references-list-host');
    if(!host){
      const section = document.createElement('section');
      section.id = 'references';
      section.className = 'references';
      section.setAttribute('aria-label', 'References');
      const wrap = document.createElement('div');
      wrap.className = 'article-wrapper';
      const h2 = document.createElement('h2');
      h2.textContent = 'References';
      wrap.appendChild(h2);
      host = document.createElement('div');
      host.id = 'references-list-host';
      wrap.appendChild(host);
      section.appendChild(wrap);
      document.body.appendChild(section);
    }

    const ol = document.createElement('ol');
    ol.className = 'bib-list';

    keys.forEach(k => {
      const li = document.createElement('li');
      li.id = 'bib-' + cssEscape(k);
      li.className = 'bib-entry';

      const body = document.createElement('span');
      body.className = 'bib-body';
      body.innerHTML = fmtBibEntry(k);
      li.appendChild(body);

      const sites = cited[k];
      if(sites && sites.length){
        const back = document.createElement('span');
        back.className = 'bib-backrefs';
        back.appendChild(document.createTextNode(' ['));
        sites.forEach((s, i) => {
          if(i) back.appendChild(document.createTextNode(', '));
          const a = document.createElement('a');
          a.href = '#' + s.id;
          a.className = 'bib-backref';
          a.textContent = '§' + s.idx;
          back.appendChild(a);
        });
        back.appendChild(document.createTextNode(']'));
        li.appendChild(back);
      }

      ol.appendChild(li);
    });
    while(host.firstChild) host.removeChild(host.firstChild);
    host.appendChild(ol);
  }

  function cssEscape(s){
    if(window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_\-]/g, '_');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', process);
  } else {
    process();
  }
})();
