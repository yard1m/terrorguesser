#!/usr/bin/env python3
"""Build the Lone attackers section: attacks by individuals (or pairs) with no organisation behind them.

The player guesses the ideology. Each file shows the attacker's photo when Wikidata has a freely
licensed one (Wikimedia Commons, P18) on the attacker's own English Wikipedia article; otherwise it
shows an emblem of the attack method. The attacker's name is still only the last clue, so photos with
the name printed on them (wanted posters, placards) are excluded in EXCLUDE_QIDS after review.

Writes public/data/lone.json.
"""
import json
import sys
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_global import batch_titles, get_entities, claim, name_matches  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "public" / "data" / "lone.json"

IDEOLOGIES = {
    "whitesup": ("White supremacist / neo-Nazi", "Beyaz üstünlükçü / neo-Nazi",
                 "Attacks driven by racist, antisemitic, anti-Muslim or anti-immigrant beliefs, often framed by the 'great replacement' conspiracy theory. Many of these attackers published manifestos and copied earlier attacks.",
                 "Irkçı, antisemitik, Müslüman karşıtı ya da göçmen karşıtı inançlarla yapılan saldırılar; çoğu 'büyük yer değiştirme' komplo teorisiyle gerekçelendirilir. Bu saldırganların birçoğu manifesto yayımladı ve önceki saldırıları taklit etti."),
    "jihad": ("Jihadist", "Cihatçı",
              "Attacks by individuals inspired by, or pledging allegiance to, groups such as the Islamic State or al-Qaeda, usually without direct orders from them.",
              "İslam Devleti ya da El Kaide gibi örgütlerden ilham alan ya da onlara biat eden, çoğunlukla doğrudan emir almadan hareket eden kişilerin saldırıları."),
    "antigov": ("Anti-government / anti-technology", "Devlet karşıtı / teknoloji karşıtı",
                "Attacks aimed at the federal government, police or the tax system, often linked to the militia and sovereign-citizen movements, plus the anti-technology bombing campaign of the Unabomber.",
                "Çoğu milis ve 'egemen vatandaş' hareketleriyle bağlantılı olarak federal hükümeti, polisi ya da vergi sistemini hedef alan saldırılar; ayrıca Unabomber'ın teknoloji karşıtı bombalama kampanyası."),
    "left": ("Left-wing / animal rights", "Sol / hayvan hakları",
             "Attacks by individuals motivated by left-wing politics or animal-rights convictions, aimed at politicians they saw as dangerous.",
             "Sol siyasetten ya da hayvan hakları inancından güç alan, tehlikeli gördükleri siyasetçileri hedef alan kişilerin saldırıları."),
    "incel": ("Misogynist (incel)", "Kadın düşmanı (incel)",
              "Attacks driven by hatred of women, often by men in the online 'involuntary celibate' subculture, which celebrates several of these attackers.",
              "Kadınlara duyulan nefretle yapılan saldırılar; çoğunlukla bu saldırganların bazılarını yücelten çevrimiçi 'istemsiz bekâr' (incel) alt kültüründen erkekler tarafından."),
    "antiab": ("Anti-abortion", "Kürtaj karşıtı",
               "Murders and bombings aimed at abortion providers and clinics, mostly in the United States in the 1990s.",
               "Çoğunlukla 1990'larda ABD'de kürtaj yapan doktorları ve klinikleri hedef alan cinayetler ve bombalamalar."),
}

METHODS = {
    "shooting": ("Shooting", "Silahlı saldırı"), "bombing": ("Bombing", "Bombalı saldırı"),
    "bomb_shoot": ("Bombing and shooting", "Bombalı ve silahlı saldırı"), "vehicle": ("Vehicle ramming", "Araçla ezme"),
    "vehicle_stab": ("Vehicle and knife attack", "Araç ve bıçakla saldırı"), "stabbing": ("Stabbing", "Bıçaklı saldırı"),
    "shoot_stab": ("Shooting and stabbing", "Silahlı ve bıçaklı saldırı"), "mailbomb": ("Mail bombs", "Posta bombaları"),
    "plane": ("Aircraft crash", "Uçak çarpma"), "firebomb": ("Firebombing", "Yangın bombası"), "mixed": ("Stabbing, shooting and ramming", "Bıçak, silah ve araçla saldırı"),
}

# (key, ideology, method, year, place EN, place TR, cc, lat, lon, target EN, target TR, attacker(s), killed, attack name EN, attack name TR)
ATTACKS = [
    ("christchurch", "whitesup", "shooting", 2019, "Christchurch, New Zealand", "Christchurch, Yeni Zelanda", "NZ", -43.53, 172.62, "Two mosques during Friday prayers", "Cuma namazı sırasında iki cami", "Brenton Tarrant", 51, "Christchurch mosque shootings", "Christchurch cami saldırıları"),
    ("utoya", "whitesup", "bomb_shoot", 2011, "Oslo and Utøya, Norway", "Oslo ve Utøya, Norveç", "NO", 60.02, 10.25, "Government offices, then a Labour Party youth camp", "Hükümet binaları, ardından İşçi Partisi gençlik kampı", "Anders Behring Breivik", 77, "Oslo bombing and Utøya shooting", "Oslo bombalaması ve Utøya katliamı"),
    ("charleston", "whitesup", "shooting", 2015, "Charleston, United States", "Charleston, ABD", "US", 32.78, -79.93, "A Bible study group at a historic Black church", "Tarihî bir siyahi kilisesinde İncil çalışma grubu", "Dylann Roof", 9, "Charleston church shooting", "Charleston kilise saldırısı"),
    ("elpaso", "whitesup", "shooting", 2019, "El Paso, United States", "El Paso, ABD", "US", 31.76, -106.44, "Shoppers at a supermarket, targeting Hispanics", "Hispanikleri hedef alarak bir süpermarketteki alışverişçiler", "Patrick Crusius", 23, "El Paso Walmart shooting", "El Paso Walmart saldırısı"),
    ("pittsburgh", "whitesup", "shooting", 2018, "Pittsburgh, United States", "Pittsburgh, ABD", "US", 40.44, -79.92, "A synagogue during Sabbath services", "Şabat ayini sırasında bir sinagog", "Robert Bowers", 11, "Pittsburgh synagogue shooting", "Pittsburgh sinagog saldırısı"),
    ("buffalo", "whitesup", "shooting", 2022, "Buffalo, United States", "Buffalo, ABD", "US", 42.91, -78.85, "A supermarket in a mostly Black neighbourhood", "Çoğunluğu siyahi bir mahalledeki süpermarket", "Payton Gendron", 10, "Buffalo supermarket shooting", "Buffalo süpermarket saldırısı"),
    ("halle", "whitesup", "shooting", 2019, "Halle, Germany", "Halle, Almanya", "DE", 51.48, 11.97, "A synagogue on Yom Kippur, then a kebab shop", "Yom Kippur'da bir sinagog, ardından bir dönerci", "Stephan Balliet", 2, "Halle synagogue shooting", "Halle sinagog saldırısı"),
    ("hanau", "whitesup", "shooting", 2020, "Hanau, Germany", "Hanau, Almanya", "DE", 50.13, 8.92, "Two shisha bars frequented by people of immigrant background", "Göçmen kökenlilerin gittiği iki nargile kafe", "Tobias Rathjen", 9, "Hanau shootings", "Hanau saldırıları"),
    ("quebec", "whitesup", "shooting", 2017, "Quebec City, Canada", "Quebec, Kanada", "CA", 46.78, -71.29, "A mosque after evening prayers", "Akşam namazından sonra bir cami", "Alexandre Bissonnette", 6, "Quebec City mosque shooting", "Quebec cami saldırısı"),
    ("oakcreek", "whitesup", "shooting", 2012, "Oak Creek, United States", "Oak Creek, ABD", "US", 42.88, -87.91, "A Sikh temple", "Bir Sih tapınağı", "Wade Michael Page", 6, "Wisconsin Sikh temple shooting", "Wisconsin Sih tapınağı saldırısı"),
    ("londonnail", "whitesup", "bombing", 1999, "London, United Kingdom", "Londra, Birleşik Krallık", "GB", 51.51, -0.13, "Black, Bangladeshi and gay neighbourhoods, with nail bombs", "Siyahi, Bangladeşli ve gey mahalleleri, çivili bombalarla", "David Copeland", 3, "1999 London nail bombings", "1999 Londra çivili bomba saldırıları"),
    ("jocox", "whitesup", "shoot_stab", 2016, "Birstall, United Kingdom", "Birstall, Birleşik Krallık", "GB", 53.73, -1.66, "A Labour member of parliament", "İşçi Partili bir milletvekili", "Thomas Mair", 1, "Murder of Jo Cox", "Jo Cox cinayeti"),
    ("overland", "whitesup", "shooting", 2014, "Overland Park, United States", "Overland Park, ABD", "US", 38.93, -94.67, "A Jewish community centre and a Jewish retirement home", "Bir Yahudi toplum merkezi ve bir Yahudi huzurevi", "Frazier Glenn Miller", 3, "Overland Park Jewish Community Center shooting", "Overland Park Yahudi merkezi saldırısı"),
    ("poway", "whitesup", "shooting", 2019, "Poway, United States", "Poway, ABD", "US", 32.96, -117.04, "A synagogue on the last day of Passover", "Hamursuz Bayramı'nın son gününde bir sinagog", "John Earnest", 1, "Poway synagogue shooting", "Poway sinagog saldırısı"),
    ("bratislava", "whitesup", "shooting", 2022, "Bratislava, Slovakia", "Bratislava, Slovakya", "SK", 48.15, 17.11, "A gay bar", "Bir gey barı", "Juraj Krajčík", 2, "2022 Bratislava shooting", "2022 Bratislava saldırısı"),
    ("munich", "whitesup", "shooting", 2016, "Munich, Germany", "Münih, Almanya", "DE", 48.18, 11.53, "Young people at a shopping centre, most of immigrant background", "Bir alışveriş merkezindeki, çoğu göçmen kökenli gençler", "David Sonboly", 9, "2016 Munich shooting", "2016 Münih saldırısı"),
    ("jacksonville", "whitesup", "shooting", 2023, "Jacksonville, United States", "Jacksonville, ABD", "US", 30.35, -81.69, "Black customers at a discount store", "Bir indirim mağazasındaki siyahi müşteriler", "Ryan Palmeter", 3, "2023 Jacksonville shooting", "2023 Jacksonville saldırısı"),
    ("lapshyn", "whitesup", "stabbing", 2013, "Birmingham, United Kingdom", "Birmingham, Birleşik Krallık", "GB", 52.48, -1.89, "An elderly Muslim man, then mosques with homemade bombs", "Yaşlı bir Müslüman adam, ardından el yapımı bombalarla camiler", "Pavlo Lapshyn", 1, "Murder of Mohammed Saleem", "Mohammed Saleem cinayeti"),
    ("nice", "jihad", "vehicle", 2016, "Nice, France", "Nice, Fransa", "FR", 43.69, 7.26, "Crowds watching Bastille Day fireworks", "Bastille Günü havai fişeklerini izleyen kalabalık", "Mohamed Lahouaiej-Bouhlel", 86, "2016 Nice truck attack", "2016 Nice kamyon saldırısı"),
    ("orlando", "jihad", "shooting", 2016, "Orlando, United States", "Orlando, ABD", "US", 28.52, -81.38, "A gay nightclub", "Bir gey gece kulübü", "Omar Mateen", 49, "Orlando nightclub shooting", "Orlando gece kulübü saldırısı"),
    ("manchester", "jihad", "bombing", 2017, "Manchester, United Kingdom", "Manchester, Birleşik Krallık", "GB", 53.49, -2.24, "Fans leaving a pop concert", "Bir pop konserinden çıkan hayranlar", "Salman Abedi", 22, "Manchester Arena bombing", "Manchester Arena bombalaması"),
    ("forthood", "jihad", "shooting", 2009, "Fort Hood, United States", "Fort Hood, ABD", "US", 31.13, -97.78, "Soldiers at an army base", "Bir askerî üsteki askerler", "Nidal Hasan", 13, "2009 Fort Hood shooting", "2009 Fort Hood saldırısı"),
    ("boston", "jihad", "bombing", 2013, "Boston, United States", "Boston, ABD", "US", 42.35, -71.08, "Spectators at the finish line of a marathon", "Bir maratonun bitiş çizgisindeki seyirciler", "Tamerlan and Dzhokhar Tsarnaev", 3, "Boston Marathon bombing", "Boston Maratonu bombalaması"),
    ("westminster", "jihad", "vehicle_stab", 2017, "London, United Kingdom", "Londra, Birleşik Krallık", "GB", 51.50, -0.12, "Pedestrians on a bridge, then a police officer guarding parliament", "Bir köprüdeki yayalar, ardından parlamentoyu koruyan bir polis", "Khalid Masood", 5, "2017 Westminster attack", "2017 Westminster saldırısı"),
    ("toulouse", "jihad", "shooting", 2012, "Toulouse, France", "Toulouse, Fransa", "FR", 43.60, 1.44, "Off-duty soldiers, then a Jewish school", "İzinli askerler, ardından bir Yahudi okulu", "Mohammed Merah", 7, "Toulouse and Montauban shootings", "Toulouse ve Montauban saldırıları"),
    ("paty", "jihad", "stabbing", 2020, "Conflans-Sainte-Honorine, France", "Conflans-Sainte-Honorine, Fransa", "FR", 49.00, 2.10, "A schoolteacher", "Bir öğretmen", "Abdoullakh Anzorov", 1, "Murder of Samuel Paty", "Samuel Paty cinayeti"),
    ("vienna", "jihad", "shooting", 2020, "Vienna, Austria", "Viyana, Avusturya", "AT", 48.21, 16.37, "People out at bars in the city centre", "Şehir merkezindeki barlarda vakit geçiren insanlar", "Kujtim Fejzulai", 4, "2020 Vienna attack", "2020 Viyana saldırısı"),
    ("stockholm", "jihad", "vehicle", 2017, "Stockholm, Sweden", "Stockholm, İsveç", "SE", 59.33, 18.06, "Shoppers on a pedestrian street", "Yaya caddesindeki alışverişçiler", "Rakhmat Akilov", 5, "2017 Stockholm truck attack", "2017 Stockholm kamyon saldırısı"),
    ("nyc2017", "jihad", "vehicle", 2017, "New York, United States", "New York, ABD", "US", 40.72, -74.01, "Cyclists and pedestrians on a bike path", "Bisiklet yolundaki bisikletliler ve yayalar", "Sayfullo Saipov", 8, "2017 New York City truck attack", "2017 New York kamyon saldırısı"),
    ("rigby", "jihad", "vehicle_stab", 2013, "London, United Kingdom", "Londra, Birleşik Krallık", "GB", 51.49, 0.07, "An off-duty soldier in the street", "Sokakta izinli bir asker", "Michael Adebolajo and Michael Adebowale", 1, "Murder of Lee Rigby", "Lee Rigby cinayeti"),
    ("sanbernardino", "jihad", "shooting", 2015, "San Bernardino, United States", "San Bernardino, ABD", "US", 34.08, -117.28, "A county health department's holiday party", "Bir ilçe sağlık müdürlüğünün yılbaşı partisi", "Syed Rizwan Farook and Tashfeen Malik", 14, "2015 San Bernardino attack", "2015 San Bernardino saldırısı"),
    ("berlin", "jihad", "vehicle", 2016, "Berlin, Germany", "Berlin, Almanya", "DE", 52.51, 13.34, "A Christmas market", "Bir Noel pazarı", "Anis Amri", 13, "2016 Berlin truck attack", "2016 Berlin kamyon saldırısı"),
    ("okc", "antigov", "bombing", 1995, "Oklahoma City, United States", "Oklahoma City, ABD", "US", 35.47, -97.52, "A federal government building with a day-care centre", "İçinde kreş bulunan bir federal hükümet binası", "Timothy McVeigh (with Terry Nichols)", 168, "Oklahoma City bombing", "Oklahoma City bombalaması"),
    ("unabomber", "antigov", "mailbomb", 1978, "Across the United States (1978–1995)", "ABD'nin çeşitli yerleri (1978–1995)", "US", 47.00, -112.73, "Universities, airlines and scientists", "Üniversiteler, havayolları ve bilim insanları", "Ted Kaczynski", 3, "Unabomber bombing campaign", "Unabomber bombalama kampanyası"),
    ("austin", "antigov", "plane", 2010, "Austin, United States", "Austin, ABD", "US", 30.40, -97.72, "A tax office building, by flying a small plane into it", "Küçük bir uçakla çarparak bir vergi dairesi binası", "Andrew Joseph Stack", 1, "2010 Austin suicide attack", "2010 Austin intihar saldırısı"),
    ("lasvegas2014", "antigov", "shooting", 2014, "Las Vegas, United States", "Las Vegas, ABD", "US", 36.17, -115.14, "Two police officers eating lunch, then a shopper", "Öğle yemeği yiyen iki polis, ardından bir alışverişçi", "Jerad and Amanda Miller", 3, "2014 Las Vegas shootings", "2014 Las Vegas saldırısı"),
    ("frein", "antigov", "shooting", 2014, "Blooming Grove, United States", "Blooming Grove, ABD", "US", 41.39, -75.13, "A state police barracks", "Bir eyalet polis karakolu", "Eric Frein", 1, "2014 Pennsylvania State Police barracks attack", "2014 Pennsylvania polis karakolu saldırısı"),
    ("baseball", "left", "shooting", 2017, "Alexandria, United States", "Alexandria, ABD", "US", 38.82, -77.07, "Republican members of Congress at baseball practice", "Beyzbol antrenmanındaki Cumhuriyetçi Kongre üyeleri", "James Hodgkinson", 0, "Congressional baseball shooting", "Kongre beyzbol saldırısı"),
    ("fortuyn", "left", "shooting", 2002, "Hilversum, Netherlands", "Hilversum, Hollanda", "NL", 52.23, 5.17, "A Dutch anti-immigration politician", "Göç karşıtı bir Hollandalı siyasetçi", "Volkert van der Graaf", 1, "Assassination of Pim Fortuyn", "Pim Fortuyn suikastı"),
    ("islavista", "incel", "mixed", 2014, "Isla Vista, United States", "Isla Vista, ABD", "US", 34.41, -119.86, "Students near a university, targeting women", "Kadınları hedef alarak bir üniversite yakınındaki öğrenciler", "Elliot Rodger", 6, "2014 Isla Vista killings", "2014 Isla Vista cinayetleri"),
    ("toronto", "incel", "vehicle", 2018, "Toronto, Canada", "Toronto, Kanada", "CA", 43.76, -79.41, "Pedestrians on a busy street", "Kalabalık bir caddedeki yayalar", "Alek Minassian", 11, "2018 Toronto van attack", "2018 Toronto minibüs saldırısı"),
    ("polytechnique", "incel", "shooting", 1989, "Montreal, Canada", "Montreal, Kanada", "CA", 45.50, -73.61, "Women engineering students", "Kadın mühendislik öğrencileri", "Marc Lépine", 14, "École Polytechnique massacre", "École Polytechnique katliamı"),
    ("plymouth", "incel", "shooting", 2021, "Plymouth, United Kingdom", "Plymouth, Birleşik Krallık", "GB", 50.40, -4.17, "His mother, then passers-by", "Annesi, ardından yoldan geçenler", "Jake Davison", 5, "2021 Plymouth shooting", "2021 Plymouth saldırısı"),
    ("tallahassee", "incel", "shooting", 2018, "Tallahassee, United States", "Tallahassee, ABD", "US", 30.44, -84.28, "A hot-yoga studio", "Bir sıcak yoga stüdyosu", "Scott Beierle", 2, "2018 Tallahassee shooting", "2018 Tallahassee saldırısı"),
    ("rudolph", "antiab", "bombing", 1996, "Atlanta and Birmingham, United States", "Atlanta ve Birmingham, ABD", "US", 33.76, -84.39, "The Olympic park, abortion clinics and a lesbian bar", "Olimpiyat parkı, kürtaj klinikleri ve bir lezbiyen barı", "Eric Rudolph", 3, "Eric Rudolph bombings", "Eric Rudolph bombalamaları"),
    ("tiller", "antiab", "shooting", 2009, "Wichita, United States", "Wichita, ABD", "US", 37.69, -97.34, "An abortion doctor at church", "Kilisede bir kürtaj doktoru", "Scott Roeder", 1, "Murder of George Tiller", "George Tiller cinayeti"),
    ("slepian", "antiab", "shooting", 1998, "Amherst, United States", "Amherst, ABD", "US", 42.98, -78.80, "An abortion doctor at home, by a sniper", "Evinde bir kürtaj doktoru, keskin nişancı tarafından", "James Kopp", 1, "Murder of Barnett Slepian", "Barnett Slepian cinayeti"),
    ("hill", "antiab", "shooting", 1994, "Pensacola, United States", "Pensacola, ABD", "US", 30.42, -87.22, "An abortion doctor and his escort", "Bir kürtaj doktoru ve refakatçisi", "Paul Jennings Hill", 2, "Murders of John Britton and James Barrett", "John Britton ve James Barrett cinayetleri"),
    ("gunn", "antiab", "shooting", 1993, "Pensacola, United States", "Pensacola, ABD", "US", 30.47, -87.20, "An abortion doctor outside his clinic", "Kliniğinin önünde bir kürtaj doktoru", "Michael F. Griffin", 1, "Murder of David Gunn", "David Gunn cinayeti"),
    ("salvi", "antiab", "shooting", 1994, "Brookline, United States", "Brookline, ABD", "US", 42.33, -71.12, "Receptionists at two abortion clinics", "İki kürtaj kliniğindeki resepsiyonistler", "John Salvi", 2, "Brookline abortion clinic shootings", "Brookline kürtaj kliniği saldırıları"),
    ("dc2009", "whitesup", "shooting", 2009, "Washington, D.C., United States", "Washington, ABD", "US", 38.89, -77.03, "The United States Holocaust Memorial Museum", "ABD Holokost Anıt Müzesi", "James von Brunn", 1, "United States Holocaust Memorial Museum shooting", "ABD Holokost Müzesi saldırısı"),
    ("nynj2016", "jihad", "bombing", 2016, "New York and New Jersey, United States", "New York ve New Jersey, ABD", "US", 40.74, -74.00, "A street in Chelsea, Manhattan, and a charity run in New Jersey", "Manhattan'ın Chelsea semtinde bir cadde ve New Jersey'de bir yardım koşusu", "Ahmad Khan Rahami", 0, "2016 New York and New Jersey bombings", "2016 New York ve New Jersey bombalamaları"),
    ("portauthority", "jihad", "bombing", 2017, "New York, United States", "New York, ABD", "US", 40.76, -73.99, "Commuters in a subway passage under the Port Authority Bus Terminal", "Port Authority otobüs terminalinin altındaki metro geçidindeki yolcular", "Akayed Ullah", 0, "2017 New York City attempted bombing", "2017 New York bombalama girişimi"),
    ("pensacola", "jihad", "shooting", 2019, "Pensacola, United States", "Pensacola, ABD", "US", 30.35, -87.29, "Classmates at a US naval air station, where he was a Saudi trainee pilot", "Suudi öğrenci pilot olarak bulunduğu ABD deniz hava üssündeki sınıf arkadaşları", "Mohammed Saeed Alshamrani", 3, "2019 Naval Air Station Pensacola shooting", "2019 Pensacola deniz hava üssü saldırısı"),
    ("timessq", "jihad", "bombing", 2010, "New York, United States", "New York, ABD", "US", 40.76, -73.99, "Crowds in Times Square, with a car bomb that failed to go off", "Patlamayan bomba yüklü bir araçla Times Meydanı'ndaki kalabalık", "Faisal Shahzad", 0, "2010 Times Square car bombing attempt", "2010 Times Meydanı bombalı araç girişimi"),
    ("bath", "antigov", "bombing", 1927, "Bath Township, United States", "Bath Township, ABD", "US", 42.82, -84.45, "The village school, over a property tax he blamed on it", "Suçladığı bir emlak vergisi yüzünden köy okulu", "Andrew Kehoe", 44, "Bath School disaster", "Bath Okulu katliamı"),
    ("tacoma", "left", "firebomb", 2019, "Tacoma, United States", "Tacoma, ABD", "US", 47.25, -122.42, "An immigration detention centre", "Bir göçmen gözaltı merkezi", "Willem van Spronsen", 0, "2019 Tacoma immigration detention centre attack", "2019 Tacoma göçmen gözaltı merkezi saldırısı"),
    ("portland", "left", "shooting", 2020, "Portland, United States", "Portland, ABD", "US", 45.52, -122.68, "A supporter of a right-wing group after a pro-Trump rally", "Trump yanlısı bir mitingin ardından sağcı bir grubun destekçisi", "Michael Reinoehl", 1, "Killing of Aaron Danielson", "Aaron Danielson cinayeti"),
]


# English Wikipedia articles about the attacker(s) themselves. Titles that redirect to the attack
# article resolve to a non-person item and are skipped, so the file falls back to the emblem.
PHOTO_TITLES = {
    "christchurch": ["Brenton Tarrant"], "utoya": ["Anders Behring Breivik"], "charleston": ["Dylann Roof"],
    "elpaso": ["Patrick Crusius"], "pittsburgh": ["Robert Bowers"], "buffalo": ["Payton Gendron"],
    "halle": ["Stephan Balliet"], "hanau": ["Tobias Rathjen"], "quebec": ["Alexandre Bissonnette"],
    "oakcreek": ["Wade Michael Page"], "londonnail": ["David Copeland"], "jocox": ["Thomas Mair"],
    "overland": ["Frazier Glenn Miller Jr."], "poway": ["John Earnest"], "bratislava": ["Juraj Krajčík"],
    "munich": ["David Sonboly"], "jacksonville": ["Ryan Palmeter"], "lapshyn": ["Pavlo Lapshyn"],
    "nice": ["Mohamed Lahouaiej-Bouhlel"], "orlando": ["Omar Mateen"], "manchester": ["Salman Abedi"],
    "forthood": ["Nidal Hasan"], "boston": ["Dzhokhar Tsarnaev", "Tamerlan Tsarnaev"],
    "westminster": ["Khalid Masood"], "toulouse": ["Mohammed Merah"], "paty": ["Abdoullakh Anzorov"],
    "vienna": ["Kujtim Fejzulai"], "stockholm": ["Rakhmat Akilov"], "nyc2017": ["Sayfullo Saipov"],
    "rigby": ["Michael Adebolajo", "Michael Adebowale"], "sanbernardino": ["Syed Rizwan Farook", "Tashfeen Malik"],
    "berlin": ["Anis Amri"], "okc": ["Timothy McVeigh"], "unabomber": ["Ted Kaczynski"],
    "austin": ["Joseph Stack", "Andrew Joseph Stack"], "lasvegas2014": ["Jerad Miller"], "frein": ["Eric Frein"],
    "baseball": ["James Hodgkinson"], "fortuyn": ["Volkert van der Graaf"], "islavista": ["Elliot Rodger"],
    "toronto": ["Alek Minassian"], "polytechnique": ["Marc Lépine"], "plymouth": ["Jake Davison"],
    "tallahassee": ["Scott Beierle"], "rudolph": ["Eric Rudolph"], "tiller": ["Scott Roeder"],
    "slepian": ["James Kopp"], "hill": ["Paul Jennings Hill"], "gunn": ["Michael F. Griffin"], "salvi": ["John Salvi"],
}
# Person items found by searching Wikidata directly, for attackers whose enwiki title is only a redirect.
PINNED = {"christchurch": "Q62067238", "jacksonville": "Q133895721", "nyc2017": "Q42549569"}
EXCLUDE_QIDS = {
    "Q44220",     # Breivik: the photo is his own staged self-portrait from the manifesto (propaganda image)
    "Q20203314",  # Roof: CCTV still with the date burned in, which gives away the year clue
}


# Commons files picked by hand where the attacker's Wikidata item has no photo (each reviewed by eye).
FILES = {
    "pittsburgh": "Robert Bowers mugshot.jpg",
    "poway": "John Earnest mugshot - 2022.jpg",
    "sanbernardino": "Syed Rizwan Farook.png",
    "rudolph": "Eric Rudolph U.S. Army portrait.jpg",
    "charleston": "Charleston Church shooting CCTV Still (cropped).png",
    "toulouse": "Mohamed Merah.jpg",
    "dc2009": "James von Brunn.jpg",
    "nynj2016": "SEEKING INFORMATION Ahmad Khan Rahami (cropped).jpg",
    "portauthority": "Akayed Ullah.png",
    "pensacola": "Mohammed Saeed Alshamrani.png",
    "timessq": "Amd mug faisal-shahzad.jpg",
    "bath": "AndrewKehoe.jpg",
    "tacoma": "Willem-van-spronsen.jpg",
    "portland": "Michael Reinoehl man.png",
}
# Faces cropped out of Commons images that carry a name or other text, hosted in public/img/lone/.
LOCAL = {
    "berlin": "Anis Amri.jpg",  # BKA wanted poster; the poster prints the name
    "utoya": "Terrorist Anders Behring Breivik 2011 fake police ID portrait as trial evidence on display at 22. juli-senteret 22 July Information Center Oslo Norway (photo 2022-03) DSC02881.jpg",
    "elpaso": "2019 El Paso shooting CCTV still.webp",
}


def commons(f):
    q = urllib.parse.quote(f.replace(" ", "_"))
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + q + "?width=480", "https://commons.wikimedia.org/wiki/File:" + q


def find_photos():
    titles = [t for ts in PHOTO_TITLES.values() for t in ts]
    hits = batch_titles(titles)
    for key, q in PINNED.items():
        hits["pin:" + key] = q
        PHOTO_TITLES[key] = PHOTO_TITLES[key] + ["pin:" + key]
    ents = get_entities([hits[t] for t in hits])
    out = {}
    for key, ts in PHOTO_TITLES.items():
        for t in ts:
            q = hits.get(t)
            e = ents.get(q, {}) if q else {}
            human = any(c.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id") == "Q5"
                        for c in e.get("claims", {}).get("P31", []))
            img = claim(e, "P18")
            why = ("no article" if not q else "not a person (redirect)" if not human else
                   "name mismatch" if not t.startswith("pin:") and not name_matches(t, e) else "no photo" if not img else
                   "excluded" if q in EXCLUDE_QIDS else None)
            print(f"  {key:14} {t:28} {q or '-':10} {why or 'PHOTO ' + img}")
            if why is None:
                out[key] = {"q": q, "img": "https://commons.wikimedia.org/wiki/Special:FilePath/"
                            + urllib.parse.quote(img.replace(" ", "_")) + "?width=480",
                            "file": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(img.replace(" ", "_"))}
                break
    for key, f in FILES.items():
        img, page = commons(f)
        out[key] = {"img": img, "file": page}
    for key, f in LOCAL.items():
        out[key] = {"img": f"img/lone/{key}.jpg", "file": commons(f)[1]}
    return out


def main():
    photos = find_photos()
    people = []
    for i, a in enumerate(ATTACKS):
        key, ide, method, year, pen, ptr, cc, lat, lon, ten, ttr, who, killed, nen, ntr = a
        people.append({"id": i, "k": key, "o": ide, "m": method, "y": year, "place": pen, "place_tr": ptr, "cc": cc,
                       "b": {"lat": lat, "lon": lon, "place": pen}, "target": ten, "target_tr": ttr, "who": who,
                       "killed": killed, "attack": nen, "attack_tr": ntr})
        if key in photos:
            people[-1].update(photos[key])
    dropped = [p["k"] for p in people if not p.get("img")]
    people = [dict(p, id=i) for i, p in enumerate(p for p in people if p.get("img"))]
    print("no photo, left out:", ", ".join(dropped))
    orgs = {k: {"name": v[0], "name_tr": v[1], "desc": v[2], "desc_tr": v[3], "count": sum(1 for p in people if p["o"] == k)}
            for k, v in IDEOLOGIES.items()}
    methods = {k: {"en": v[0], "tr": v[1]} for k, v in METHODS.items()}
    OUT.write_text(json.dumps({"orgs": orgs, "methods": methods, "people": people}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(len(people), {k: o["count"] for k, o in orgs.items()}, "with photo:", len(photos))


if __name__ == "__main__":
    main()
