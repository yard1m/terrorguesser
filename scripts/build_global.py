#!/usr/bin/env python3
"""Build the Global section: a hand-curated roster of historical members of well-documented
terrorist organisations, enriched from Wikidata (photo, birth/death, birthplace + coordinates).

Curation rules
- Organisation members only. The game asks "which organisation?", so lone-actor mass shooters
  (Christchurch, Utøya, Charleston, ...) are deliberately left out: they have no group to guess,
  and a gallery of them is the format extremist channels use to celebrate them.
- People who are dead, convicted, or who openly admitted their role. No living person is included
  on an unproven allegation. Every match must carry the English Wikipedia article that was asked for.

Usage: python3 scripts/build_global.py   -> public/data/global.json (+ prints a review table)
"""
import json
import re
import unicodedata
import time
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "global.json"
API = "https://www.wikidata.org/w/api.php"
UA = "terrorguesser-databuild/0.2 (educational quiz; contact via repository)"

GROUPS = {
    "ira": ("Provisional IRA / INLA", "Irish republican paramilitaries of the Troubles (1969–1998) who fought to end British rule in Northern Ireland through bombings and shootings in Ireland and Britain."),
    "loyal": ("Ulster loyalists (UVF, UDA, LVF)", "Pro-British paramilitary groups in Northern Ireland that killed hundreds of people, most of them Catholic civilians, during the Troubles."),
    "eta": ("ETA", "Euskadi Ta Askatasuna, a Basque separatist group that killed over 800 people in Spain and France between 1968 and its dissolution in 2018."),
    "pkk": ("PKK (historical leadership)", "The Kurdistan Workers' Party, founded by Abdullah Öcalan in 1978, which began its armed campaign against Turkey in 1984. Öcalan was captured in 1999 and is serving a life sentence."),
    "asala": ("ASALA / JCAG", "Armenian militant groups that assassinated dozens of Turkish diplomats and bombed targets in Europe and Turkey from 1975 to the mid-1980s, including the 1982 Esenboğa airport attack and the 1983 Orly bombing."),
    "eoka": ("EOKA", "Greek Cypriot guerrilla organisation that fought British rule in Cyprus (1955–59) for union with Greece; its successor EOKA-B helped bring about the 1974 coup."),
    "ltte": ("Tamil Tigers (LTTE)", "Liberation Tigers of Tamil Eelam, a separatist army in Sri Lanka (1976–2009) that pioneered suicide bombing and assassinated Indian PM Rajiv Gandhi."),
    "khalistan": ("Babbar Khalsa", "Sikh separatist group fighting for an independent Khalistan, responsible for the 1985 bombing of Air India Flight 182, which killed 329 people."),
    "chechen": ("Chechen and Caucasus jihadists", "Armed groups of the Chechen wars and the later Caucasus Emirate, behind the 2002 Moscow theatre siege and the 2004 Beslan school massacre."),
    "yb": ("Young Bosnia / Black Hand", "Bosnian Serb revolutionaries armed by the Serbian secret society Black Hand; their assassination of Archduke Franz Ferdinand in 1914 triggered the First World War."),
    "imro": ("IMRO", "The Internal Macedonian Revolutionary Organization, which in the 1920s–30s carried out assassinations across the Balkans, including the 1934 killing of King Alexander of Yugoslavia in Marseille."),
    "irgun": ("Irgun / Lehi", "Zionist underground groups in British Mandate Palestine (1930s–1948) that bombed and assassinated British and Arab targets, including the 1946 King David Hotel bombing."),
    "nv": ("Narodnaya Volya", "'People's Will', a 19th-century Russian revolutionary organisation that assassinated Tsar Alexander II in 1881."),
    "sr": ("SR Combat Organization", "The terrorist wing of Russia's Socialist Revolutionary Party (1902–1911), which assassinated government ministers and a grand duke."),
    "anarch": ("Anarchist 'propaganda of the deed'", "Anarchists of the 1880s–1910s who tried to spark revolution through bombings and assassinations, killing among others a French president, an Italian king, an Austrian empress and a US president."),
    "raf": ("Red Army Faction", "West German far-left urban guerrillas (also called the Baader-Meinhof Group), active 1970–1998, known for kidnappings and assassinations of business and state figures. Includes the allied 2 June Movement."),
    "br": ("Red Brigades", "Italian Marxist-Leninist group of the 'Years of Lead', most notorious for kidnapping and murdering former prime minister Aldo Moro in 1978."),
    "plpac": ("Prima Linea / PAC", "Smaller Italian armed-left groups of the Years of Lead, including Prima Linea and the Armed Proletarians for Communism."),
    "ad": ("Action Directe", "French far-left group (1979–1987) that assassinated the head of Renault, Georges Besse, and a senior defence official."),
    "n17": ("17 November", "Greek Marxist group that killed 23 people between 1975 and 2002, including US, British and Turkish diplomats, and went undiscovered for 27 years."),
    "jra": ("Japanese Red Army", "Japanese communist militants who allied with Palestinian groups, carried out the 1972 Lod Airport massacre and a string of hijackings and embassy seizures. Includes the United Red Army."),
    "wu": ("Weather Underground", "US radical-left group (1969–1977) that bombed government buildings in protest against the Vietnam War."),
    "bla": ("Black Liberation Army", "US Black nationalist underground group (1970–1981) that killed police officers and carried out robberies, including the 1981 Brink's robbery."),
    "sla": ("Symbionese Liberation Army", "Small US radical group (1973–75) known for murdering an Oakland school superintendent and kidnapping the heiress Patty Hearst."),
    "turkleft": ("Turkish revolutionary left (1970s)", "The armed left-wing groups of 1970s Turkey (THKO, THKP-C, TKP/ML and Dev-Sol), behind kidnappings, bank robberies and killings; several founders were killed or executed."),
    "sl": ("Shining Path", "Sendero Luminoso, a Maoist insurgency in Peru (1980 onward) responsible for tens of thousands of deaths in a war with the state."),
    "mrta": ("MRTA (Túpac Amaru)", "Peruvian Marxist guerrillas who seized the Japanese ambassador's residence in Lima in 1996 and held 72 hostages for four months."),
    "farc": ("FARC", "Revolutionary Armed Forces of Colombia, a Marxist guerrilla army (1964–2016) that financed itself through kidnapping and the drug trade before a peace deal."),
    "eln": ("ELN", "Colombia's National Liberation Army, a Marxist guerrilla group founded in 1964 and influenced by liberation theology."),
    "m19": ("M-19", "Colombian urban guerrilla movement (1970–1990) whose 1985 seizure of the Palace of Justice ended with about 100 dead; it later became a political party."),
    "aq": ("Al-Qaeda", "Global jihadist network founded by Osama bin Laden in 1988; responsible for the 1998 US embassy bombings and the 11 September 2001 attacks. Includes affiliates such as AQAP and al-Qaeda in Iraq."),
    "isis": ("Islamic State", "Jihadist group that declared a 'caliphate' across Iraq and Syria in 2014 and directed or inspired attacks worldwide, including Paris (2015) and Brussels (2016)."),
    "ji": ("Jemaah Islamiyah", "South-East Asian jihadist network linked to al-Qaeda, responsible for the 2002 Bali bombings that killed 202 people."),
    "boko": ("Boko Haram", "Nigerian jihadist group known for mass killings and the 2014 kidnapping of 276 schoolgirls from Chibok."),
    "shabaab": ("al-Shabaab", "Somali jihadist group allied with al-Qaeda, behind the 2013 Westgate mall attack in Nairobi and the 2017 Mogadishu truck bombing."),
    "let": ("Lashkar-e-Taiba", "Pakistan-based jihadist group behind the 2008 Mumbai attacks, which killed 166 people."),
    "ttp": ("Pakistani Taliban (TTP)", "Tehrik-i-Taliban Pakistan, an alliance of militant groups fighting the Pakistani state, responsible for the 2014 Peshawar school massacre."),
    "gia": ("GIA / AQIM", "Algerian jihadist groups of the 1990s civil war and their successor, al-Qaeda in the Islamic Maghreb."),
    "eij": ("Egyptian Islamic Jihad / Gama'a", "Egyptian militant groups that assassinated President Anwar Sadat in 1981 and carried out the 1997 Luxor massacre."),
    "abusayyaf": ("Abu Sayyaf", "Philippine jihadist group known for kidnappings and beheadings, and for the 2004 SuperFerry 14 bombing that killed 116 people."),
    "hezb": ("Hezbollah", "Lebanese Shia movement and militia backed by Iran, linked to the 1983 Beirut barracks bombings and the 1994 AMIA bombing in Buenos Aires. The US, the EU (its military wing) and others list it as a terrorist organisation."),
    "hamas": ("Hamas", "Palestinian Islamist movement whose armed wing carried out suicide bombings in the 1990s–2000s and the 7 October 2023 attack on Israel. The US, the EU and the UK list it as a terrorist organisation; Turkey and many other countries do not."),
    "pij": ("Palestinian Islamic Jihad", "Iran-backed Palestinian militant group founded in 1981, known for suicide bombings in Israel."),
    "pal": ("PFLP / Black September / Abu Nidal", "Palestinian militant factions of the 1960s–1990s behind airliner hijackings, the 1972 Munich Olympics massacre and international assassinations."),
    "aum": ("Aum Shinrikyo", "Japanese doomsday cult whose members released sarin nerve gas on the Tokyo subway in 1995, killing 14 and injuring thousands."),
    "manson": ("Manson Family", "Commune and cult led by Charles Manson, whose members murdered nine people in California in 1969, including the actress Sharon Tate, hoping to start an apocalyptic race war."),
    "temple": ("Peoples Temple", "Jim Jones's cult, whose members killed US Congressman Leo Ryan in Guyana in 1978 before more than 900 people died in a mass murder-suicide at Jonestown."),
    "kkk": ("Ku Klux Klan", "White supremacist movement whose members carried out bombings and murders against the US civil rights movement, such as the 1963 Birmingham church bombing that killed four girls."),
    "far": ("Neo-fascist cells (NAR, Ordine Nuovo, NSU)", "Far-right terror groups in Italy and Germany, from the 1980 Bologna station bombing to the NSU's racist murder series of 2000–2007."),
}

ROSTER = {
    "ira": ["Bobby Sands", "Brendan Hughes", "Patrick Magee (Irish republican)", "Mairéad Farrell", "Dolours Price", "Marian Price",
            "Seán Mac Stíofáin", "Dominic McGlinchey", "Francis Hughes", "Thomas McMahon (Irish republican)", "Joe Cahill", "Michael McKevitt",
            "Ruairí Ó Brádaigh", "Seán Russell", "Martin McGuinness", "Kieran Doherty", "Gerry Kelly", "Brendan McFarlane", "Seamus Twomey",
            "Billy McKee", "Martin Meehan", "Seamus Costello", "Raymond McCreesh", "Patsy O'Hara", "Joe McDonnell",
            "Kevin Lynch (hunger striker)", "Thomas McElwee", "Dáithí Ó Conaill", "Cathal Goulding", "Dessie O'Hare"],
    "loyal": ["Gusty Spence", "Billy Wright (loyalist)", "Johnny Adair", "Michael Stone (loyalist)", "Lenny Murphy", "Robin Jackson",
              "John McMichael", "Andy Tyrie"],
    "eta": ["José Antonio Urrutikoetxea", "Iñaki de Juana Chaos", "Francisco Múgica Garmendia", "Javier García Gaztelu",
            "José Miguel Beñaran Ordeñana", "María Dolores González Katarain", "Txabi Etxebarrieta", "Mikel Albisu Iriarte",
            "Soledad Iparraguirre", "Francisco Javier López Peña", "Garikoitz Aspiazu Rubina", "Domingo Troitiño", "Henri Parot",
            "Santiago Arrospide Sarasola"],
    "pkk": ["Abdullah Öcalan", "Sakine Cansız", "Mazlum Doğan", "Kemal Pir", "Mahsum Korkmaz"],
    "asala": ["Hagop Hagopian", "Monte Melkonian", "Levon Ekmekjian", "Varoujan Garbidjian", "Hampig Sassounian", "Mardiros Jamkojian",
              "Alec Yenikomshian"],
    "eoka": ["Georgios Grivas", "Grigoris Afxentiou", "Evagoras Pallikarides", "Nikos Sampson", "Kyriakos Matsis", "Michalakis Karaolis"],
    "ltte": ["Velupillai Prabhakaran", "Pottu Amman", "Thenmozhi Rajaratnam", "S. P. Thamilselvan", "Anton Balasingham",
             "Sathasivam Krishnakumar", "Mahattaya", "Soosai"],
    "khalistan": ["Talwinder Singh Parmar", "Inderjit Singh Reyat", "Sukhdev Singh Babbar"],
    "chechen": ["Shamil Basayev", "Dokka Umarov", "Ibn al-Khattab", "Arbi Barayev", "Ruslan Gelayev", "Movsar Barayev", "Abu al-Walid"],
    "yb": ["Gavrilo Princip", "Nedeljko Čabrinović", "Dragutin Dimitrijević", "Trifko Grabež", "Danilo Ilić", "Muhamed Mehmedbašić",
           "Vojislav Tankosić", "Vaso Čubrilović", "Cvjetko Popović", "Bogdan Žerajić"],
    "imro": ["Vlado Chernozemski", "Ivan Mihailov", "Todor Aleksandrov", "Mara Buneva"],
    "irgun": ["Menachem Begin", "Yitzhak Shamir", "Avraham Stern", "Eliyahu Hakim", "Eliyahu Bet-Zuri", "Natan Yellin-Mor",
              "Yehoshua Cohen", "Dov Gruner", "Yaakov Meridor", "Amichai Paglin"],
    "nv": ["Sophia Perovskaya", "Andrei Zhelyabov", "Nikolai Kibalchich", "Ignacy Hryniewiecki", "Vera Figner", "Nikolai Rysakov",
           "Alexander Ulyanov", "Stepan Khalturin", "Lev Tikhomirov", "Mikhail Frolenko"],
    "sr": ["Ivan Kalyayev", "Boris Savinkov", "Grigory Gershuni", "Yegor Sazonov", "Yevno Azef", "Maria Spiridonova", "Dora Brilliant",
           "Stepan Balmashov"],
    "anarch": ["Gaetano Bresci", "Luigi Lucheni", "Sante Geronimo Caserio", "Ravachol", "Émile Henry", "Auguste Vaillant",
               "Luigi Galleani", "Mario Buda", "Alexander Berkman", "Michele Angiolillo", "Mateu Morral", "Leon Czolgosz", "Paulino Pallás",
               "Jules Bonnot", "Raymond Callemin"],
    "raf": ["Andreas Baader", "Ulrike Meinhof", "Gudrun Ensslin", "Jan-Carl Raspe", "Holger Meins", "Brigitte Mohnhaupt", "Christian Klar",
            "Wolfgang Grams", "Birgit Hogefeld", "Irmgard Möller", "Peter-Jürgen Boock", "Inge Viett", "Horst Mahler", "Astrid Proll",
            "Siegfried Haag", "Rolf Heißler", "Adelheid Schulz", "Stefan Wisniewski", "Knut Folkerts", "Verena Becker", "Susanne Albrecht",
            "Silke Maier-Witt", "Michael Baumann", "Ralf Reinders", "Till Meyer", "Gabriele Kröcher-Tiedemann"],
    "br": ["Renato Curcio", "Mario Moretti", "Alberto Franceschini", "Margherita Cagol", "Barbara Balzerani", "Prospero Gallinari",
           "Valerio Morucci", "Adriana Faranda", "Giovanni Senzani", "Nadia Desdemona Lioce", "Patrizio Peci", "Anna Laura Braghetti",
           "Bruno Seghetti", "Raffaele Fiore", "Alessio Casimirri", "Rita Algranati", "Mario Galesi", "Corrado Alunni"],
    "plpac": ["Cesare Battisti", "Sergio Segio", "Marco Donat-Cattin", "Susanna Ronconi"],
    "ad": ["Jean-Marc Rouillan", "Nathalie Ménigon", "Joëlle Aubron", "Georges Cipriani", "Régis Schleicher"],
    "n17": ["Alexandros Giotopoulos", "Dimitris Koufontinas", "Savvas Xiros", "Christodoulos Xiros"],
    "jra": ["Fusako Shigenobu", "Kōzō Okamoto", "Haruo Wakō", "Tsuyoshi Okudaira", "Kunio Bandō", "Osamu Maruoka", "Yu Kikumura",
            "Hiroko Nagata", "Tsuneo Mori", "Takaya Shiomi", "Takamaro Tamiya"],
    "wu": ["Kathy Boudin", "David Gilbert (activist)", "Diana Oughton", "Ted Gold", "Terry Robbins", "Bernardine Dohrn", "Mark Rudd",
           "Bill Ayers", "Jeff Jones (activist)", "Cathy Wilkerson", "Judith Alice Clark", "Susan Rosenberg", "Laura Whitehorn",
           "Linda Evans (radical)"],
    "bla": ["Assata Shakur", "Mutulu Shakur", "Sekou Odinga", "Kuwasi Balagoon", "Nuh Washington", "Herman Bell", "Jalil Muntaqim",
            "Twymon Myers", "Marilyn Buck"],
    "sla": ["Donald DeFreeze", "Emily Harris", "Kathleen Soliah", "Nancy Ling Perry", "Patricia Soltysik", "Angela Atwood",
            "Joseph Remiro", "Russell Little", "Camilla Hall", "Willie Wolfe"],
    "turkleft": ["Deniz Gezmiş", "Mahir Çayan", "İbrahim Kaypakkaya", "Hüseyin İnan", "Yusuf Aslan", "Ulaş Bardakçı", "Sinan Cemgil",
                 "Dursun Karataş"],
    "sl": ["Abimael Guzmán", "Elena Iparraguirre", "Augusta La Torre", "Óscar Ramírez Durand", "Edith Lagos",
           "Florindo Eleuterio Flores Hala", "Osmán Morote", "Laura Zambrano", "Martha Huatay"],
    "mrta": ["Víctor Polay", "Néstor Cerpa Cartolini", "Lori Berenson", "Peter Cárdenas Schulte"],
    "farc": ["Manuel Marulanda", "Raúl Reyes", "Alfonso Cano", "Mono Jojoy", "Simón Trinidad", "Jacobo Arenas", "Iván Ríos",
             "Gentil Duarte", "Jesús Santrich", "Martín Caballero", "Negro Acacio"],
    "eln": ["Camilo Torres Restrepo", "Manuel Pérez Martínez", "Fabio Vásquez Castaño"],
    "m19": ["Jaime Bateman Cayón", "Carlos Pizarro Leongómez", "Álvaro Fayad", "Iván Marino Ospina", "Andrés Almarales"],
    "aq": ["Osama bin Laden", "Ayman al-Zawahiri", "Khalid Sheikh Mohammed", "Mohamed Atta", "Abu Musab al-Zarqawi",
           "Anwar al-Awlaki", "Ramzi Yousef", "Zacarias Moussaoui", "Richard Reid", "Ziad Jarrah", "Marwan al-Shehhi",
           "Hani Hanjour", "Umar Farouk Abdulmutallab", "Abu Yahya al-Libi", "Atiyah Abd al-Rahman", "Nawaf al-Hazmi",
           "Khalid al-Mihdhar", "Satam al-Suqami", "Waleed al-Shehri", "Wail al-Shehri", "Abdulaziz al-Omari", "Hamza al-Ghamdi",
           "Ahmed al-Ghamdi", "Mohand al-Shehri", "Fayez Banihammad", "Saeed al-Ghamdi", "Ahmed al-Haznawi", "Ahmed al-Nami",
           "Salem al-Hazmi", "Majed Moqed", "Mohammed Atef", "Hamza bin Laden", "Anas al-Liby", "Fazul Abdullah Mohammed",
           "Wadih el-Hage", "Mohamed Rashed Daoud Al-Owhali", "Ibrahim al-Asiri", "Nasir al-Wuhayshi", "Qasim al-Raymi",
           "Mustafa Abu al-Yazid", "Abu Laith al-Libi", "Ilyas Kashmiri", "Ali Mohamed"],
    "isis": ["Abu Bakr al-Baghdadi", "Abu Mohammad al-Adnani", "Mohammed Emwazi", "Abdelhamid Abaaoud", "Salah Abdeslam",
             "Abu Omar al-Shishani", "Junaid Hussain", "Abu Ibrahim al-Hashimi al-Qurashi", "Najim Laachraoui", "Mohamed Abrini",
             "Sally-Anne Jones", "Abu Ayyub al-Masri", "Abu Hassan al-Muhajir", "Abu Ali al-Anbari", "Abu Muslim al-Turkmani",
             "Haji Bakr", "Abu Waheeb", "Omar Ismaïl Mostefaï", "Brahim Abdeslam", "Samy Amimour", "Bilal Hadfi", "Chakib Akrouh",
             "Amedy Coulibaly", "Anis Amri", "Abu Omar al-Baghdadi"],
    "ji": ["Hambali", "Abu Bakar Ba'asyir", "Amrozi", "Imam Samudra", "Ali Ghufron", "Dulmatin", "Noordin Mohammad Top",
           "Azahari Husin", "Umar Patek", "Abdullah Sungkar"],
    "boko": ["Mohammed Yusuf (Boko Haram)", "Abubakar Shekau", "Mamman Nur"],
    "shabaab": ["Ahmed Abdi Godane", "Aden Hashi Farah Ayro", "Ibrahim al-Afghani"],
    "let": ["Hafiz Saeed", "Ajmal Kasab", "Zakiur Rehman Lakhvi", "David Headley"],
    "ttp": ["Baitullah Mehsud", "Hakimullah Mehsud", "Nek Muhammad Wazir", "Maulana Fazlullah", "Qari Hussain"],
    "gia": ["Djamel Zitouni", "Antar Zouabri", "Abdelmalek Droukdel", "Mokhtar Belmokhtar", "Hassan Hattab", "Abdelhak Layada"],
    "eij": ["Omar Abdel-Rahman", "Khalid Islambouli", "Muhammad abd-al-Salam Faraj", "Abbud al-Zumar", "Rifai Taha"],
    "abusayyaf": ["Abdurajak Abubakar Janjalani", "Khadaffy Janjalani", "Isnilon Hapilon", "Abu Sabaya"],
    "hezb": ["Imad Mughniyeh", "Hassan Nasrallah", "Mustafa Badreddine", "Abbas al-Musawi", "Fuad Shukr", "Ibrahim Aqil",
             "Hashem Safieddine"],
    "hamas": ["Ahmed Yassin", "Abdel Aziz al-Rantisi", "Yahya Ayyash", "Salah Shehade", "Yahya Sinwar", "Mohammed Deif",
              "Ismail Haniyeh", "Saleh al-Arouri", "Marwan Issa", "Ahmed Jabari", "Mahmoud al-Mabhouh"],
    "pij": ["Fathi Shaqaqi", "Ramadan Shalah", "Baha Abu al-Ata"],
    "pal": ["George Habash", "Wadie Haddad", "Leila Khaled", "Carlos the Jackal", "Abu Nidal", "Abu Daoud", "Ali Hassan Salameh",
            "Abu Abbas", "Dalal Mughrabi", "Salah Khalaf", "Ahmed Jibril", "Rasmea Odeh", "Ahmad Sa'adat", "Abu Ali Mustafa"],
    "aum": ["Shoko Asahara", "Hideo Murai", "Tomomasa Nakagawa", "Seiichi Endo", "Kiyohide Hayakawa", "Ikuo Hayashi",
            "Kenichi Hirose", "Masato Yokoyama"],
    "manson": ["Charles Manson", "Tex Watson", "Susan Atkins", "Patricia Krenwinkel", "Leslie Van Houten", "Bobby Beausoleil",
               "Lynette Fromme", "Steve Grogan", "Bruce Davis (Manson Family)"],
    "temple": ["Jim Jones", "Larry Layton"],
    "kkk": ["Robert Edward Chambliss", "Thomas Edwin Blanton Jr.", "Bobby Frank Cherry", "Byron De La Beckwith", "Edgar Ray Killen",
            "Samuel Bowers", "Henry Francis Hays", "J. B. Stoner"],
    "far": ["Valerio Fioravanti", "Francesca Mambro", "Luigi Ciavardini", "Uwe Mundlos", "Uwe Böhnhardt", "Beate Zschäpe",
            "Vincenzo Vinciguerra"],
}

# When the top search hit is the wrong person, pin the QID here after reviewing the table.
PINNED = {}

# Photos reviewed by eye and rejected: wrong subject, artwork, or the name is printed in the image.
EXCLUDE_QIDS = {
    "Q3121820",  # Dolores González Katarain: Commons image is an Oteiza sculpture
    "Q6769521",  # Mark Rudd: image shows Tom Hayden
    "Q6377186",  # Kathy Boudin: FBI poster with her name
    "Q5675981",  # Haruo Wakō: police poster with his name
    "Q3736564",  # Yū Kikumura: photo attribution doubtful
    "Q1551351",  # Uwe Mundlos: military ID card with his name
    "Q327802",  # Kevin Lynch: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q220236",  # Thomas McElwee: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q5609088",  # Grigoris Afxentiou: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q5415247",  # Evagoras Pallikarides: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q3536130",  # Thillaiyampalam Sivanesan: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q672922",  # Ivan Mihailov: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q2466136",  # Todor Aleksandrov: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q2365699",  # Eliyahu Bet-Zuri: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q4746127",  # Amichai Paglin: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q317709",  # Luigi Lucheni: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q558456",  # Ravachol: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q6174180",  # Jeff Jones: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q7648337",  # Susan Rosenberg: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q5294232",  # Donald DeFreeze: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q3817131",  # Elena Iparraguirre: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q4821003",  # Augusta La Torre: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q6123682",  # Jaime Bateman Cayón: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q1766782",  # Umar Patek: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q400735",  # Ahmad Sa'adat: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q238111",  # Susan Atkins: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q444301",  # Leslie Van Houten: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q508703",  # Lynette Fromme: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
    "Q7343972",  # Robert Edward Chambliss: reviewed photo rejected (name/caption/placard in image, artwork, or no visible face)
}
EXCLUDE_NAMES = {"Steve Grogan", "Larry Layton"}  # resolve to a footballer / to the victim Leo Ryan
# Verified noms de guerre whose article is under the legal name.
ALIAS_OK = {"Kathleen Soliah", "Florindo Eleuterio Flores Hala", "Mono Jojoy", "Negro Acacio", "Hambali", "Ali Ghufron", "Abbud al-Zumar"}


def unicodedata_norm(x):
    return "".join(c for c in unicodedata.normalize("NFKD", x or "") if not unicodedata.combining(c))


def api(params):
    params = {**params, "format": "json", "formatversion": "2"}
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers={"User-Agent": UA})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            wait = int(e.headers.get("Retry-After") or 0) or 5 * (attempt + 1)
            print(f"  HTTP {e.code}, waiting {wait}s", flush=True)
            time.sleep(wait)
        except Exception as e:
            print(f"  {e!r}, retrying", flush=True)
            time.sleep(5 * (attempt + 1))
    raise RuntimeError("Wikidata request failed: " + str(params)[:120])


def claim(ent, prop):
    for c in ent.get("claims", {}).get(prop, []):
        v = c.get("mainsnak", {}).get("datavalue", {}).get("value")
        if v is not None:
            return v
    return None


def year_of(v):
    if isinstance(v, dict) and v.get("time"):
        t = v["time"]
        sign = -1 if t.startswith("-") else 1
        return sign * int(t[1:5])
    return None


def get_entities(ids, props="claims|labels|descriptions|sitelinks|aliases"):
    out = {}
    ids = list(dict.fromkeys(i for i in ids if i))
    for i in range(0, len(ids), 50):
        res = api({"action": "wbgetentities", "ids": "|".join(ids[i:i + 50]), "props": props, "languages": "en|tr",
                   "sitefilter": "enwiki"})
        out.update(res.get("entities", {}))
        time.sleep(0.3)
    return out


CACHE_PATH = ROOT / "sources" / "wikidata_qids.json"
CACHE = json.loads(CACHE_PATH.read_text(encoding="utf-8")) if CACHE_PATH.exists() else {}


def resolve(name):
    if name in PINNED:
        return PINNED[name]
    if name in CACHE:
        return CACHE[name]
    q = _resolve(name)
    CACHE[name] = q
    CACHE_PATH.write_text(json.dumps(CACHE, ensure_ascii=False, indent=1), encoding="utf-8")
    return q


def _resolve(name):
    res = api({"action": "wbsearchentities", "search": name, "language": "en", "type": "item", "limit": 6})
    cands = [r["id"] for r in res.get("search", [])]
    ents = get_entities(cands, props="claims")
    for q in cands:
        e = ents.get(q, {})
        if any(c.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id") == "Q5"
               for c in e.get("claims", {}).get("P31", [])):
            return q
    return None


def batch_titles(names):
    """Map Wikipedia article titles to Wikidata QIDs, 50 per request (follows redirects)."""
    found = {}
    for i in range(0, len(names), 50):
        chunk = names[i:i + 50]
        url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode({
            "action": "query", "titles": "|".join(chunk), "prop": "pageprops", "ppprop": "wikibase_item",
            "redirects": 1, "format": "json", "formatversion": 2})
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            res = json.loads(r.read().decode("utf-8"))["query"]
        alias = {}
        for m in res.get("normalized", []) + res.get("redirects", []):
            alias[m["to"]] = alias.get(m["from"], m["from"])
        for page in res.get("pages", []):
            q = page.get("pageprops", {}).get("wikibase_item")
            if not q:
                continue
            t = page["title"]
            src = t
            while src in alias:
                src = alias[src]
            found[src] = q
            found[t] = q
        time.sleep(0.5)
    return found


def _norm(x):
    x = unicodedata_norm(x)
    return re.sub(r"[^a-z ]", " ", x.lower())


def name_matches(name, ent):
    """The person we got must carry (part of) the requested name in its label, aliases or enwiki title."""
    want = [w for w in _norm(re.sub(r"\(.*?\)", "", name)).split() if len(w) >= 4 and w not in {"abdel", "abdul"}]
    if not want:
        return True
    names = []
    for lang_labels in (ent.get("labels", {}), ):
        names += [v.get("value", "") for v in lang_labels.values()]
    for al in ent.get("aliases", {}).values():
        names += [a.get("value", "") for a in al]
    names.append((ent.get("sitelinks", {}).get("enwiki", {}) or {}).get("title", ""))
    hay = " ".join(_norm(n) for n in names)
    return any(w in hay.split() for w in want)


def join_place(place, country):
    if not place:
        return country
    return place if not country or country == place else f"{place}, {country}"


def main():
    all_names = [n for names in ROSTER.values() for n in names]
    todo = [n for n in all_names if n not in CACHE and n not in PINNED]
    if todo:
        hits = batch_titles(todo)
        for n in todo:
            if n in hits:
                CACHE[n] = hits[n]
        CACHE_PATH.write_text(json.dumps(CACHE, ensure_ascii=False, indent=1), encoding="utf-8")
    qids = {}
    for gid, names in ROSTER.items():
        for name in names:
            qids[(gid, name)] = resolve(name)
    ents = get_entities(list(qids.values()))
    place_ids, country_ids = set(), set()
    for e in ents.values():
        p = claim(e, "P19")
        if p: place_ids.add(p["id"])
        c = claim(e, "P27")
        if c: country_ids.add(c["id"])
    places = get_entities(list(place_ids), props="claims|labels")
    for pl in places.values():
        c = claim(pl, "P17")
        if c: country_ids.add(c["id"])
    countries = get_entities(list(country_ids), props="labels")
    def label(d, q, lang="en"):
        if not q:
            return None
        labs = d.get(q, {}).get("labels", {})
        return (labs.get(lang) or labs.get("en") or {}).get("value")

    people, review = [], []
    for (gid, name), q in qids.items():
        e = ents.get(q, {}) if q else {}
        img = claim(e, "P18")
        desc = (e.get("descriptions", {}).get("en", {}) or {}).get("value", "")
        lab = (e.get("labels", {}).get("en", {}) or {}).get("value", name)
        review.append((gid, name, q, lab, desc[:70], "img" if img else "-"))
        wiki_title = (e.get("sitelinks", {}).get("enwiki", {}) or {}).get("title")
        is_human = any(c.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id") == "Q5"
                       for c in e.get("claims", {}).get("P31", []))
        if q and not is_human:
            print(f"  DROP {name}: {q} is not a person (redirect or disambiguation)")
            continue
        if q and name not in ALIAS_OK and not name_matches(name, e):
            print(f"  DROP {name}: resolved to '{lab}', which does not carry that name (redirect to someone else?)")
            continue
        if q and not wiki_title:
            print(f"  DROP {name}: {q} has no English Wikipedia article (likely a wrong match)")
            continue
        if not q or not img or q in EXCLUDE_QIDS or name in EXCLUDE_NAMES:
            continue
        pl = claim(e, "P19")
        plq = pl["id"] if pl else None
        coord = claim(places.get(plq, {}), "P625") if plq else None
        pc = claim(places.get(plq, {}), "P17") if plq else None
        nat = claim(e, "P27")
        place_label = label(places, plq)
        country_label = label(countries, pc["id"]) if pc else None
        place_tr = label(places, plq, "tr")
        country_tr = label(countries, pc["id"], "tr") if pc else None
        people.append({
            "n": lab,
            "q": q,
            "y": year_of(claim(e, "P569")),
            "d": year_of(claim(e, "P570")),
            "b": {"place": join_place(place_label, country_label),
                  "lat": coord["latitude"] if coord else None, "lon": coord["longitude"] if coord else None},
            "nat": label(countries, nat["id"]) if nat else None,
            "nat_tr": label(countries, nat["id"], "tr") if nat else None,
            "place_tr": join_place(place_tr, country_tr),
            "img": ["https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(img.replace(" ", "_")) + "?width=480"],
            "file": img,
            "wiki": (e.get("sitelinks", {}).get("enwiki", {}) or {}).get("title"),
            "o": gid,
        })
    for i, p in enumerate(people):
        p["id"] = i
    orgs = {gid: {"name": n, "desc": d, "count": sum(1 for p in people if p["o"] == gid)} for gid, (n, d) in GROUPS.items()}
    OUT.write_text(json.dumps({"generated": time.strftime("%Y-%m-%d"), "orgs": orgs, "people": people},
                              ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for r in review:
        print(" | ".join(str(x) for x in r))
    print("\nkept:", len(people), {g: o["count"] for g, o in orgs.items()})


if __name__ == "__main__":
    main()
