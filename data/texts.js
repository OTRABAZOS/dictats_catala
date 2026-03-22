// Base de coneixement: Textos en català per nivells
// Cada text té pauses marcades amb || per indicar on el TTS ha de fer pausa llarga

const texts = {
  basic: [
    {
      id: 'b1',
      title: 'El matí',
      text: 'Avui fa un dia molt bonic. || El sol brilla i el cel és blau. || M\'agrada passejar pel parc. || Els ocells canten alegrement. || La natura és meravellosa.',
      description: 'Frases curtes i simples sobre el dia',
    },
    {
      id: 'b2',
      title: 'La família',
      text: 'La meva família és molt gran. || Tinc dos germans i una germana. || Els meus pares es diuen Joan i Maria. || Vivim en una casa al centre de la ciutat. || Els diumenges dinem tots junts.',
      description: 'Vocabulari bàsic de la família',
    },
    {
      id: 'b3',
      title: 'El mercat',
      text: 'Vaig al mercat cada setmana. || Compro fruita fresca i verdures. || La taronja és el meu fruit preferit. || El venedor és molt amable. || Sempre em dona un bon preu.',
      description: 'Vocabulari del mercat i la compra',
    },
    {
      id: 'b4',
      title: 'L\'escola',
      text: 'Els nens van a l\'escola cada dia. || Aprenen a llegir i a escriure. || La mestra explica la lliçó amb paciència. || Al pati juguen amb els amics. || L\'escola és molt important per als infants.',
      description: 'Vocabulari escolar bàsic',
    },
    {
      id: 'b5',
      title: 'El menjar',
      text: 'Per dinar menjo arròs amb verdures. || M\'agrada molt la cuina catalana. || La paella és un plat molt típic. || De postres prenc una peça de fruita. || Bec aigua durant els àpats.',
      description: 'Vocabulari de l\'alimentació',
    },
  ],

  intermedi: [
    {
      id: 'i1',
      title: 'Les tradicions catalanes',
      text: 'La Castanyada és una festa molt estimada a Catalunya. || Se celebra la nit del dia 31 d\'octubre. || La gent menja castanyes rostides i panellets. || Els panellets es fan amb marzipà i pinyons. || És una tradició que s\'ha mantingut al llarg dels segles.',
      description: 'Festivitats i tradicions catalanes',
    },
    {
      id: 'i2',
      title: 'El paisatge català',
      text: 'Catalunya és un país de contrastos geogràfics admirables. || Al nord hi ha els alts cims dels Pirineus, coberts de neu a l\'hivern. || A l\'est, la Mediterrània banya les costes amb les seves aigües blaves. || A l\'interior hi ha planes fèrtils on creixen els cereals i la vinya. || Cada comarca té la seva personalitat i el seu caràcter propi.',
      description: 'Descripció geogràfica del país',
    },
    {
      id: 'i3',
      title: 'La llengua catalana',
      text: 'El català és una llengua romànica que prové del llatí vulgar. || Es parla a Catalunya, al País Valencià, a les Illes Balears i a altres territoris. || Té una literatura molt rica que remunta a l\'edat mitjana. || Ramon Llull va ser un dels primers escriptors en llengua catalana. || Avui en dia, el català és parlat per més de deu milions de persones.',
      description: 'Història i extensió de la llengua',
    },
    {
      id: 'i4',
      title: 'La cuina catalana',
      text: 'La cuina catalana és una de les més riques i variades de la Mediterrània. || El pa amb tomàquet és el plat més senzill i popular de tots. || L\'escudella i carn d\'olla és el plat tradicional per excel·lència. || Les postres més conegudes són la crema catalana i els bunyols. || L\'oli d\'oliva és l\'ingredient bàsic de tota la cuina del país.',
      description: 'Gastronomia i receptes catalanes',
    },
    {
      id: 'i5',
      title: 'Barcelona',
      text: 'Barcelona és la capital de Catalunya i una de les ciutats més vibrants d\'Europa. || La seva arquitectura modernista, obra de Gaudí i d\'altres artistes, és coneguda arreu del món. || La Sagrada Família és el monument més visitat de tot Espanya. || El barri Gòtic conserva carrers medievals plens d\'història. || La Barceloneta és la platja urbana més famosa de la Mediterrània.',
      description: 'La capital i els seus monuments',
    },
  ],

  avancat: [
    {
      id: 'a1',
      title: 'Jacint Verdaguer',
      text: 'Jacint Verdaguer i Santaló és considerat el poeta nacional de Catalunya. || Va néixer a Folgueroles el 1845 i va morir a Vallvidriera el 1902. || La seva obra més celebrada és el poema èpic «L\'Atlàntida», publicat el 1877. || «Canigó» és un altre dels seus grans poemes, que canta la natura dels Pirineus. || Verdaguer va contribuir de manera decisiva a la Renaixença, el moviment de recuperació cultural i lingüística del segle XIX.',
      description: 'Biografia del poeta nacional català',
    },
    {
      id: 'a2',
      title: 'El Modernisme català',
      text: 'El Modernisme català va ser un moviment artístic i cultural que va florir entre els anys 1888 i 1911. || Va néixer com una expressió de modernitat i de voluntat d\'europeïtzació de la societat catalana. || En arquitectura, Antoni Gaudí va assolir cotes d\'originalitat mai no vistes, combinant formes orgàniques amb estructures revolucionàries. || Lluís Domènech i Montaner i Josep Puig i Cadafalch van ser els altres grans mestres del Modernisme arquitectònic. || La burgesia catalana va impulsar i finançar aquest moviment com a senyal d\'identitat nacional i d\'estatus social.',
      description: 'Moviment cultural i arquitectònic del segle XIX-XX',
    },
    {
      id: 'a3',
      title: 'La Guerra Civil a Catalunya',
      text: 'La Guerra Civil espanyola, que va esclatar el juliol de 1936, va tenir a Catalunya unes característiques singulars. || La resistència al cop d\'estat feixista va ser exitosa a Barcelona gràcies a la mobilització obrera i als cossos de seguretat lleials a la República. || Durant els primers mesos, a la rereguarda es va viure una autèntica revolució social impulsada pels anarquistes de la CNT i la FAI. || La caiguda de Barcelona el 26 de gener de 1939 va significar l\'inici d\'una llarga repressió contra la cultura i la llengua catalanes. || Centenars de milers de catalans van haver de marxar a l\'exili, on molts van continuar la resistència cultural i política.',
      description: 'La Guerra Civil i les seves conseqüències per Catalunya',
    },
    {
      id: 'a4',
      title: 'La Renaixença',
      text: 'La Renaixença va ser el moviment cultural que, a partir de la primera meitat del segle XIX, va reivindicar la llengua i la cultura catalanes. || Va sorgir com a resposta al llarg període de decadència literària iniciat el segle XVII. || L\'Oda a la Pàtria, de Bonaventura Carles Aribau, publicada el 1833, és considerada el text fundacional del moviment. || Els Jocs Florals, recuperats el 1859, van ser el gran certamen literari que va impulsar la producció poètica en català. || La Renaixença va donar pas, a finals del segle, al Modernisme i al Noucentisme.',
      description: 'El moviment de recuperació cultural del segle XIX',
    },
    {
      id: 'a5',
      title: 'El Cant dels Ocells',
      text: 'El Cant dels Ocells és una cançó popular catalana d\'origen medieval que ha esdevingut un himne identitari. || La melodia, de caràcter contemplatiu i solemne, evoca el cant dels ocells que saludaven el naixement de Jesús. || El violoncel·lista Pau Casals la va convertir en el seu himne personal i la tocava en tots els concerts. || Casals, exiliat a Prada de Conflent per no acceptar el franquisme, la va tocar a les Nacions Unides el 1971 com a cant per la pau. || Aquella actuació va emocionar el món i va convertir la peça en un símbol universal de pau i de resistència cultural.',
      description: 'Cançó popular i el seu significat com a símbol nacional',
    },
  ],
};

module.exports = texts;
