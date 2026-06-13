players = [
"Kylian Mbappe", "Harry Kane", "Mikel Oyarzabal", "Erling Haaland",
"Cristiano Ronaldo", "Kai Havertz", "Lionel Messi", "Julian Alvarez",
"Lamine Yamal", "Michael Olise", "Raphinha", "Igor Thiago",
"Lautaro Martinez", "Cody Gakpo", "Romelu Lukaku", "Bruno Fernandes",
"Ferran Torres", "Vinicius Jr", "Jamal Musiala", "Phil Foden",
"Bukayo Saka", "Jude Bellingham", "Alvaro Morata", "Nico Williams",
"Antoine Griezmann", "Ousmane Dembele", "Leroy Sane", "Niclas Fullkrug",
"Rafael Leao", "Rodrygo", "Endrick", "Goncalo Ramos",
"Joao Felix", "Bernardo Silva", "Xavi Simons", "Memphis Depay",
"Donyell Malen", "Christian Pulisic", "Folarin Balogun", "Santiago Gimenez",
"Hirving Lozano", "Darwin Nunez", "Federico Valverde", "Lois Openda",
"Kevin De Bruyne", "Leandro Trossard", "Alexander Isak", "Viktor Gyokeres",
"Dusan Vlahovic", "Marcus Rashford"
]

html = '<option value="">Selecciona un jugador...</option>\n'
for p in players:
    html += f'                        <option value="{p}">{p}</option>\n'

with open('options.html', 'w', encoding='utf-8') as f:
    f.write(html)
