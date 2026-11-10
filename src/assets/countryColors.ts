// Country colors mapped by UN M49 numeric code
// Colors are based on dominant flag colors for visual representation
export const countryColorsById: Record<string, string> = {
  "004": "#0072C6", // Afghanistan - Blue
  "008": "#E41E20", // Albania - Red
  "012": "#006233", // Algeria - Green
  "020": "#C8102E", // Andorra - Red
  "024": "#CE1126", // Angola - Red
  "028": "#012169", // Antigua and Barbuda - Blue
  "032": "#74ACDF", // Argentina - Blue
  "051": "#D90012", // Armenia - Red
  "036": "#012169", // Australia - Blue
  "040": "#ED2939", // Austria - Red
  "031": "#0092BC", // Azerbaijan - Blue
  "044": "#FFC72C", // Bahamas - Yellow
  "048": "#CE1126", // Bahrain - Red
  "050": "#006A4E", // Bangladesh - Green
  "052": "#00267F", // Barbados - Blue
  "112": "#C8313E", // Belarus - Red
  "056": "#000000", // Belgium - Black
  "084": "#003F87", // Belize - Blue
  "204": "#008751", // Benin - Green
  "064": "#FF4E12", // Bhutan - Orange
  "068": "#DA291C", // Bolivia - Red
  "070": "#002395", // Bosnia - Blue
  "072": "#75AADB", // Botswana - Blue
  "076": "#009739", // Brazil - Green
  "096": "#CE1126", // Brunei - Red
  "100": "#00966E", // Bulgaria - Green
  "854": "#EF2B2D", // Burkina Faso - Red
  "108": "#CE1126", // Burundi - Red
  "116": "#032EA1", // Cambodia - Blue
  "120": "#007A5E", // Cameroon - Green
  "124": "#FF0000", // Canada - Red
  "132": "#003893", // Cape Verde - Blue
  "140": "#012169", // Central African Republic - Blue
  "148": "#002664", // Chad - Blue
  "152": "#0039A6", // Chile - Blue
  "156": "#DE2910", // China - Red
  "170": "#FCD116", // Colombia - Yellow
  "174": "#C8102E", // Comoros - Red
  "178": "#009543", // Congo - Green
  "180": "#007A3D", // DR Congo - Green
  "188": "#C8102E", // Costa Rica - Red
  "191": "#FF7900", // Croatia - Red
  "192": "#C60C30", // Cuba - Red
  "196": "#D4AF37", // Cyprus - Gold
  "203": "#11457E", // Czech Republic - Blue
  "208": "#C60C30", // Denmark - Red
  "262": "#6AB2E7", // Djibouti - Blue
  "212": "#D62718", // Dominica - Red
  "214": "#C8102E", // Dominican Republic - Red
  "218": "#FFD100", // Ecuador - Yellow
  "818": "#CE1126", // Egypt - Red
  "222": "#0047AB", // El Salvador - Blue
  "226": "#007A3D", // Equatorial Guinea - Green
  "232": "#1EB53A", // Eritrea - Green
  "233": "#0072CE", // Estonia - Blue
  "231": "#078930", // Ethiopia - Green
  "242": "#012169", // Fiji - Blue
  "246": "#003580", // Finland - Blue
  "250": "#0055A4", // France - Blue
  "266": "#009E60", // Gabon - Green
  "270": "#CE1126", // Gambia - Red
  "268": "#FF0000", // Georgia - Red
  "276": "#000000", // Germany - Black
  "288": "#006B3F", // Ghana - Green
  "300": "#0D5EAF", // Greece - Blue
  "304": "#DC143C", // Greenland - Red
  "308": "#CE1126", // Grenada - Red
  "320": "#4997D0", // Guatemala - Blue
  "324": "#CE1126", // Guinea - Red
  "624": "#CE1126", // Guinea-Bissau - Red
  "328": "#009E49", // Guyana - Green
  "332": "#D21034", // Haiti - Red
  "340": "#0038A8", // Honduras - Blue
  "348": "#CD2A3E", // Hungary - Red
  "352": "#02529C", // Iceland - Blue
  "356": "#FF9933", // India - Orange
  "360": "#FF0000", // Indonesia - Red
  "364": "#239F40", // Iran - Green
  "368": "#CE1126", // Iraq - Red
  "372": "#169B62", // Ireland - Green
  "376": "#0038B8", // Israel - Blue
  "380": "#009246", // Italy - Green
  "384": "#009B3A", // Ivory Coast - Green
  "388": "#000000", // Jamaica - Black
  "392": "#BC002D", // Japan - Red
  "400": "#CE1126", // Jordan - Red
  "398": "#00AFCA", // Kazakhstan - Blue
  "404": "#006600", // Kenya - Green
  "296": "#003893", // Kiribati - Blue
  "408": "#024FA2", // North Korea - Blue
  "410": "#CD2E3A", // South Korea - Red
  "414": "#007A3D", // Kuwait - Green
  "417": "#E8112D", // Kyrgyzstan - Red
  "418": "#CE1126", // Laos - Red
  "428": "#9E3039", // Latvia - Red
  "422": "#ED1C24", // Lebanon - Red
  "426": "#002868", // Lesotho - Blue
  "430": "#002868", // Liberia - Blue
  "434": "#239E46", // Libya - Green
  "438": "#002B7F", // Liechtenstein - Blue
  "440": "#FDB913", // Lithuania - Yellow
  "442": "#00A1DE", // Luxembourg - Blue
  "807": "#CE1126", // North Macedonia - Red
  "450": "#007E3A", // Madagascar - Green
  "454": "#CE1126", // Malawi - Red
  "458": "#CC0001", // Malaysia - Red
  "462": "#D21034", // Maldives - Red
  "466": "#14B53A", // Mali - Green
  "470": "#C8102E", // Malta - Red
  "584": "#003087", // Marshall Islands - Blue
  "478": "#006233", // Mauritania - Green
  "480": "#EA2839", // Mauritius - Red
  "484": "#006847", // Mexico - Green
  "583": "#0085C7", // Micronesia - Blue
  "498": "#C8102E", // Moldova - Red
  "492": "#CE1126", // Monaco - Red
  "496": "#C4272F", // Mongolia - Red
  "499": "#C40308", // Montenegro - Red
  "504": "#C1272D", // Morocco - Red
  "508": "#007A33", // Mozambique - Green
  "104": "#FEBD11", // Myanmar - Yellow
  "516": "#003580", // Namibia - Blue
  "520": "#00A1E4", // Nauru - Blue
  "524": "#DC143C", // Nepal - Red
  "528": "#21468B", // Netherlands - Blue
  "554": "#00247D", // New Zealand - Blue
  "558": "#0067C6", // Nicaragua - Blue
  "562": "#FF7900", // Niger - Orange
  "566": "#008751", // Nigeria - Green
  "578": "#BA0C2F", // Norway - Red
  "512": "#C8102E", // Oman - Red
  "586": "#01411C", // Pakistan - Green
  "585": "#0085C7", // Palau - Blue
  "275": "#009739", // Palestine - Green
  "591": "#DA291C", // Panama - Red
  "598": "#CE1126", // Papua New Guinea - Red
  "600": "#D52B1E", // Paraguay - Red
  "604": "#D91023", // Peru - Red
  "608": "#0038A8", // Philippines - Blue
  "616": "#DC143C", // Poland - Red
  "620": "#006600", // Portugal - Green
  "634": "#8D1B3D", // Qatar - Red
  "642": "#002B7F", // Romania - Blue
  "643": "#0039A6", // Russia - Blue
  "646": "#FAD201", // Rwanda - Yellow
  "659": "#00A651", // Saint Kitts and Nevis - Green
  "662": "#0072C6", // Saint Lucia - Blue
  "670": "#009739", // Saint Vincent - Green
  "882": "#002B7F", // Samoa - Blue
  "674": "#1EB53A", // San Marino - Green
  "678": "#FFCE00", // Sao Tome - Yellow
  "682": "#006C35", // Saudi Arabia - Green
  "686": "#00853F", // Senegal - Green
  "688": "#C6363C", // Serbia - Red
  "690": "#003F87", // Seychelles - Blue
  "694": "#1EB53A", // Sierra Leone - Green
  "702": "#EF3340", // Singapore - Red
  "703": "#EE1C25", // Slovakia - Red
  "705": "#005EB8", // Slovenia - Blue
  "090": "#005170", // Solomon Islands - Blue
  "706": "#4189DD", // Somalia - Blue
  "710": "#007A4D", // South Africa - Green
  "728": "#CE1126", // South Sudan - Red
  "724": "#AA151B", // Spain - Red
  "144": "#FFBE29", // Sri Lanka - Yellow
  "729": "#D21034", // Sudan - Red
  "740": "#377E3F", // Suriname - Green
  "752": "#006AA7", // Sweden - Blue
  "756": "#FF0000", // Switzerland - Red
  "760": "#CE1126", // Syria - Red
  "158": "#005EB8", // Taiwan - Blue
  "762": "#006600", // Tajikistan - Green
  "834": "#1EB53A", // Tanzania - Green
  "764": "#A51931", // Thailand - Red
  "626": "#0052B4", // Timor-Leste - Blue
  "768": "#FFCE00", // Togo - Yellow
  "776": "#C8102E", // Tonga - Red
  "780": "#CE1126", // Trinidad and Tobago - Red
  "788": "#E70013", // Tunisia - Red
  "792": "#E30A17", // Turkey - Red
  "795": "#00843D", // Turkmenistan - Green
  "798": "#00A3DD", // Tuvalu - Blue
  "800": "#FCDC04", // Uganda - Yellow
  "804": "#0057B7", // Ukraine - Blue
  "784": "#00732F", // UAE - Green
  "826": "#012169", // UK - Blue
  "840": "#B22234", // USA - Red
  "858": "#0038A8", // Uruguay - Blue
  "860": "#1EB53A", // Uzbekistan - Green
  "548": "#C8102E", // Vanuatu - Red
  "336": "#FFE900", // Vatican City - Yellow
  "862": "#CF142B", // Venezuela - Red
  "704": "#DA251D", // Vietnam - Red
  "887": "#CE1126", // Yemen - Red
  "894": "#198A00", // Zambia - Green
  "716": "#007A4D", // Zimbabwe - Green
};
