import InfoPage, { Block, ToFill } from '../InfoPage'

export default function Legal() {
  return (
    <InfoPage kicker="Mentions légales" title="Mentions légales" intro="Passerelle est un projet de cours : un prototype de démonstration, sans activité commerciale.">
      <Block title="Éditeur">
        <p>
          Projet réalisé par <ToFill>noms de l’équipe</ToFill>, dans le cadre de <ToFill>formation et établissement</ToFill>.
        </p>
        <p>
          Contact : <ToFill>adresse de contact</ToFill>
        </p>
      </Block>
      <Block title="Hébergement">
        <p>
          <ToFill>hébergeur, adresse</ToFill>
        </p>
      </Block>
      <Block title="Données de démonstration">
        <p>
          Le réseau de transport, les horaires, l’état des ascenseurs et les tarifs affichés sont <strong className="font-medium">simulés</strong> à des fins de démonstration. Ils ne doivent pas servir à préparer un déplacement réel. Les billets émis n’ont aucune valeur et aucun paiement n’est effectué.
        </p>
      </Block>
      <Block title="Crédits">
        <ul className="flex list-disc flex-col gap-2 pl-6">
          <li>Recherche d’adresses : Géoplateforme de l’IGN (Base Adresse Nationale).</li>
          <li>Polices : Bricolage Grotesque, Instrument Serif, JetBrains Mono, Atkinson Hyperlegible (Google Fonts, licence SIL OFL).</li>
          <li>Ciel et nuages : rendu 3D réalisé avec Blender.</li>
        </ul>
      </Block>
    </InfoPage>
  )
}
