# Passerelle — la mobilité transmodale pour tous

Prototype (projet de cours) d’un service de mobilité accessible en Région Sud :
on crée son profil en répondant à quelques questions, puis le site, les trajets
et l’accompagnement s’adaptent à la personne.

## Fonctionnalités

- **Questionnaire de profil** adaptatif et accessible (clavier, lecteur d’écran, lecture à voix haute).
- **Interface adaptée** au profil : taille du texte jusqu’à 200 %, contraste élevé, police très lisible,
  animations réduites, mode simplifié, lecture à voix haute.
- **Planificateur transmodal** (métro, tram, bus, TER, grandes lignes, navettes) qui respecte le profil :
  accès sans marches, marche maximale, assistance en gare, correspondances, affluence.
  Recherche d’adresses réelles via la Géoplateforme de l’IGN.
- **Billet unique tout compris** avec QR code, réductions (carte mobilité inclusion…), services
  (Accès Plus, place PMR, vélo, chien d’assistance), échange et annulation.
- **Mode « En route »** : accompagnement étape par étape, adapté au profil (pas à pas ou essentiel,
  guidage vocal ou visuel, accès sans marches, messages rassurants), aide immédiate et nouvel
  itinéraire en cas d’imprévu.

Le profil, les trajets et les billets restent dans le navigateur (aucun compte, aucun serveur).

> Réseau, horaires, état des équipements et tarifs sont **simulés** pour la démonstration.
> Aucun paiement réel n’est effectué.

## Lancer le projet

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # version de production dans dist/
```

## Organisation

- `src/pages/` : pages (accueil, questionnaire, espace, trajets, commande, billet, En route, infos)
- `src/planner/` : réseau de démo, moteur d’itinéraires, tarifs, billets
- `src/enroute/` : découpage des étapes du mode En route selon le profil
- `src/profile/` : modèle de profil et déduction des besoins
- `src/shaders/` + `public/clouds.png` : ciel animé du hero (WebGL) et nuages rendus avec Blender
- `blender/` : scripts de rendu des nuages (voir `blender/README.md`)

React 19, TypeScript, Vite, Tailwind CSS 4, React Router.
