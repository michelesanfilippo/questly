# Prompt Batch Generation - 120 Missioni Boss

## Istruzioni per LLM

Sei un game designer esperto di game narrative. Devi generare 120 testi di missioni per un gioco fantasy RPG chiamato "Questly".

### Caratteristiche Questly:
- **Tono**: Avventuroso, magico, immersivo ma leggero
- **Stile**: Breve (50-80 parole), evocativo, con hook chiaro
- **Linguaggio**: Italiano, second person (tu/te), imperativo (comanda il giocatore)
- **Tema**: Il giocatore è un avventuriero che aiuta una gilda a sconfiggere boss weekend
- **No badge/hint**: Solo testo puro, niente riferimenti a badge o indizi

### Livelli di Difficoltà (Tono per livello):

**1⭐ (Facile)**: Tono giocoso, leggero, quasi tutorial
- Esempio: "Scopri cosa nasconde il piccolo goblin nel suo scrigno. Pensa come un furbo mercante e descrivi come ingannarlo legalmente. Ricorda: non è tradimento, è affari!"

**2⭐ (Medio-Facile)**: Tono avventuroso, con pericoli minori
- Esempio: "Il labirinto del Minotauro ha mille corridoi. Disegna il percorso sicuro prima che la bestia ti senta. La mappa è nella tua mente: dov'è l'uscita?"

**3⭐ (Medio - IL CORE)**: Tono épico, sfide significative, scelta morale
- Esempio: "Il Gigante protegge questi territori da millenni. Non si vince con la forza bruta. Come convinci un titano antico a stare dalla tua parte?"

**4⭐ (Difficile)**: Tono intenso, battute finali, rischi alti
- Esempio: "L'Idra rigenera ogni ferita. Ercole stesso ebbe difficoltà. Tu conosci il vero punto debole? Brucia le ferite, fermala prima che sia troppo tardi."

**5⭐ (Rarissimo)**: Tono mitologico, finale, destinato
- Esempio: "Il Drago Bianco è il custode del ghiaccio eterno. Pochi vivono per affrontarlo due volte. Sei pronto a shattare il trono di cristallo? La leggenda ti aspetta."

---

## 120 Missioni da Generare

Formato output atteso (JSON):
```json
{
  "boss_missions": {
    "goblin": {
      "1": [
        {
          "id": "boss_goblin_1_1",
          "title": "I Tesori Nascosti",
          "text": "[GENERATO]"
        },
        ...
      ]
    }
  }
}
```

### DIFFICOLTÀ 1⭐ (10 missioni)

#### Boss: Goblin
1. boss_goblin_1_1 | "I Tesori Nascosti" | Tema: ricchezze, astuzia
2. boss_goblin_1_2 | "Furto Leale" | Tema: furto etico, intelligenza
3. boss_goblin_1_3 | "Bazar Caotico" | Tema: negoziazione, caos goblin
4. boss_goblin_1_4 | "Carta Vincente" | Tema: gioco, fortune
5. boss_goblin_1_5 | "Bottino Maledetto" | Tema: ricchezze cursed

#### Boss: Fata
6. boss_fata_1_1 | "Incantesimo di Luce" | Tema: magia luminosa
7. boss_fata_1_2 | "Fiori Magici" | Tema: giardino incantato
8. boss_fata_1_3 | "Protezione Naturale" | Tema: scudi naturali
9. boss_fata_1_4 | "Danza delle Stelle" | Tema: magia celeste
10. boss_fata_1_5 | "Sussurri Incantati" | Tema: comunicazione magica

---

### DIFFICOLTÀ 2⭐ (23 missioni)

#### Boss: Lupo Mannaro
1. boss_lupo_mannaro_2_1 | "Trasformazione di Mezzanotte" | Tema: trasformazione, licantropia
2. boss_lupo_mannaro_2_2 | "Ululato della Foresta" | Tema: comunicazione lupi
3. boss_lupo_mannaro_2_3 | "Caccia Notturna" | Tema: caccia strategica
4. boss_lupo_mannaro_2_4 | "Controllo della Bestia" | Tema: autocontrollo, istinto
5. boss_lupo_mannaro_2_5 | "Marchio della Maledizione" | Tema: maledizione, spezzi
6. boss_lupo_mannaro_2_6 | "Luna Piena" | Tema: cicli lunari
7. boss_lupo_mannaro_2_7 | "Branco Unito" | Tema: unità, forza collettiva
8. boss_lupo_mannaro_2_8 | "Sopravvivenza Notturna" | Tema: pericoli notturni

#### Boss: Minotauro
9. boss_minotauro_2_1 | "Nel Labirinto" | Tema: labirinti, navigazione
10. boss_minotauro_2_2 | "Sfida d'Onore" | Tema: onore, sfida
11. boss_minotauro_2_3 | "Corridoi Segreti" | Tema: passaggi nascosti
12. boss_minotauro_2_4 | "Forza e Coraggio" | Tema: forza senza violenza
13. boss_minotauro_2_5 | "Redenzione" | Tema: redenzione, rottura maledizione
14. boss_minotauro_2_6 | "Alleanza Inaspettata" | Tema: alleanza
15. boss_minotauro_2_7 | "Muri di Pietra" | Tema: muri, strutture
16. boss_minotauro_2_8 | "Libertà Conquistata" | Tema: libertà, emancipazione

#### Boss: Gnomo
17. boss_gnomo_2_1 | "Caverna Antica" | Tema: archeologia, scavi
18. boss_gnomo_2_2 | "Magica Minore" | Tema: magia minore, riparazione
19. boss_gnomo_2_3 | "Tesoro di Roccia" | Tema: cristalli, minerali
20. boss_gnomo_2_4 | "Trappola Ingegnosa" | Tema: meccanica, ingegneria
21. boss_gnomo_2_5 | "Conoscenza Perduta" | Tema: saggezza antica
22. boss_gnomo_2_6 | "Cristalli Rari" | Tema: gemme rare
23. boss_gnomo_2_7 | "Segreti Sotterranei" | Tema: caverne, profondità

---

### DIFFICOLTÀ 3⭐ (45 missioni)

#### Boss: Gigante
1. boss_gigante_3_1 | "Passi del Gigante" | Tema: tracce, seguire
2. boss_gigante_3_2 | "Terra che Trema" | Tema: movimento tellurico
3. boss_gigante_3_3 | "Fortezza di Pietra" | Tema: architettura gigantesca
4. boss_gigante_3_4 | "Voce Tonante" | Tema: comunicazione gigante
5. boss_gigante_3_5 | "Rocce Mobili" | Tema: sfida ambiente
6. boss_gigante_3_6 | "Debolezza Celata" | Tema: punto debole
7. boss_gigante_3_7 | "Regno Perduto" | Tema: civiltà antica
8. boss_gigante_3_8 | "Riconciliazione" | Tema: pace, negoziato
9. boss_gigante_3_9 | "Montagne Vive" | Tema: natura consapevole
10. boss_gigante_3_10 | "Eredità Gigantesca" | Tema: eredità, memoria
11. boss_gigante_3_11 | "Alleanza Terrestre" | Tema: alleanza con terra
12. boss_gigante_3_12 | "Potenza Tellurica" | Tema: forze telluriche
13. boss_gigante_3_13 | "Memoria Pietrosa" | Tema: memoria antica
14. boss_gigante_3_14 | "Custode Antico" | Tema: guardia, protezione
15. boss_gigante_3_15 | "Titani Risvegliati" | Tema: resurrezione titani

#### Boss: Grifone
16. boss_grifone_3_1 | "Volo tra le Nuvole" | Tema: volo, libertà aerea
17. boss_grifone_3_2 | "Guardia Nobile" | Tema: nobiltà, onore
18. boss_grifone_3_3 | "Tesoro Alato" | Tema: tesoro custodito
19. boss_grifone_3_4 | "Cielo Protetto" | Tema: protezione del cielo
20. boss_grifone_3_5 | "Aquila Intelligente" | Tema: intelligenza, istinto
21. boss_grifone_3_6 | "Vento e Fuoco" | Tema: elementi
22. boss_grifone_3_7 | "Onore e Orgoglio" | Tema: onore, dignità
23. boss_grifone_3_8 | "Alleanza Celeste" | Tema: patto cosmico
24. boss_grifone_3_9 | "Penne Dorate" | Tema: bellezza, splendore
25. boss_grifone_3_10 | "Sguardo Acuto" | Tema: visione, percezione
26. boss_grifone_3_11 | "Nido Sacro" | Tema: rifugio sacro
27. boss_grifone_3_12 | "Velocità Divina" | Tema: velocità, rapidità
28. boss_grifone_3_13 | "Artigli Affilati" | Tema: armi naturali
29. boss_grifone_3_14 | "Dominio dell'Aria" | Tema: controllo ambiente
30. boss_grifone_3_15 | "Leggenda Alata" | Tema: leggenda vivente

#### Boss: Ippogrifo
31. boss_ippogrifo_3_1 | "Legame Magico" | Tema: connessione mentale
32. boss_ippogrifo_3_2 | "Corsa Incantata" | Tema: movimento magico
33. boss_ippogrifo_3_3 | "Eleganza e Grazia" | Tema: bellezza, danza
34. boss_ippogrifo_3_4 | "Magia Equestre" | Tema: magia legata cavalli
35. boss_ippogrifo_3_5 | "Terre Incantate" | Tema: paesaggi magici
36. boss_ippogrifo_3_6 | "Protezione Alata" | Tema: protezione, scudi
37. boss_ippogrifo_3_7 | "Cuore Puro" | Tema: sincerità, purezza morale
38. boss_ippogrifo_3_8 | "Eternità insieme" | Tema: patto eterno
39. boss_ippogrifo_3_9 | "Zoccoli Magici" | Tema: tracce, movimento
40. boss_ippogrifo_3_10 | "Voli Sincronizzati" | Tema: sincronizzazione, unità
41. boss_ippogrifo_3_11 | "Armonia Perfecta" | Tema: equilibrio
42. boss_ippogrifo_3_12 | "Potenza Gentile" | Tema: forza controllata
43. boss_ippogrifo_3_13 | "Saggezza Antica" | Tema: conoscenza
44. boss_ippogrifo_3_14 | "Canto dell'Amore" | Tema: amore, connessione
45. boss_ippogrifo_3_15 | "Libertà Condivisa" | Tema: libertà, condivisione

---

### DIFFICOLTÀ 4⭐ (24 missioni)

#### Boss: Idra
1. boss_idra_4_1 | "Testa Rigenerante" | Tema: rigenerazione, punto debole
2. boss_idra_4_2 | "Battaglia Impossibile" | Tema: sfida estrema
3. boss_idra_4_3 | "Veleno Antico" | Tema: veleno, resistenza
4. boss_idra_4_4 | "Strategie Mitologiche" | Tema: strategie eroiche
5. boss_idra_4_5 | "Teste Gemelle" | Tema: coordinazione, multiplo
6. boss_idra_4_6 | "Palude Letale" | Tema: ambiente ostile
7. boss_idra_4_7 | "Rigenerazione Fermata" | Tema: soluzione finale
8. boss_idra_4_8 | "Furia Mitologica" | Tema: potenza divina

#### Boss: Fenice
9. boss_fenice_4_1 | "Fiamme della Rinascita" | Tema: fuoco, rinascimento
10. boss_fenice_4_2 | "Ceneri e Rinascimento" | Tema: resurrezione
11. boss_fenice_4_3 | "Fuoco Eterno" | Tema: fuoco infinito
12. boss_fenice_4_4 | "Ciclo della Vita" | Tema: cicli naturali
13. boss_fenice_4_5 | "Morte e Nuova Vita" | Tema: dualità, trasformazione
14. boss_fenice_4_6 | "Bagliore Divino" | Tema: luce, divinità
15. boss_fenice_4_7 | "Nido Infuocato" | Tema: rifugio di fuoco
16. boss_fenice_4_8 | "Forma Perfetta" | Tema: perfezione, evoluzione

#### Boss: Basilisco
17. boss_basilisco_4_1 | "Sguardo di Pietra" | Tema: petrificazione
18. boss_basilisco_4_2 | "Antidoto Antico" | Tema: veleno, contromisure
19. boss_basilisco_4_3 | "Offesa Serpe" | Tema: combattimento serpente
20. boss_basilisco_4_4 | "Controllo Ipnotico" | Tema: ipnosi, resistenza mentale
21. boss_basilisco_4_5 | "Scaglie Impenetrabili" | Tema: difesa, durezza
22. boss_basilisco_4_6 | "Veleno Mortale" | Tema: veleno letale
23. boss_basilisco_4_7 | "Serpente Antico" | Tema: antichità, memoria
24. boss_basilisco_4_8 | "Specchio Riflettente" | Tema: tattica, specchio

---

### DIFFICOLTÀ 5⭐ (18 missioni)

#### Boss: Drago Bianco
1. boss_drago_bianco_5_1 | "Alito di Gelo" | Tema: ghiaccio, freddo primordiale
2. boss_drago_bianco_5_2 | "Purezza Gelida" | Tema: purezza, ghiaccio
3. boss_drago_bianco_5_3 | "Trono di Cristallo" | Tema: palazzo, cristallo

#### Boss: Drago Nero
4. boss_drago_nero_5_1 | "Buio Primordiale" | Tema: oscurità, caos
5. boss_drago_nero_5_2 | "Potenza Abissale" | Tema: potenza abissale
6. boss_drago_nero_5_3 | "Trono delle Ombre" | Tema: ombra, regno oscuro

#### Boss: Drago Rosso
7. boss_drago_rosso_5_1 | "Inferno Divino" | Tema: fuoco, inferno
8. boss_drago_rosso_5_2 | "Battaglia Suprema" | Tema: battaglia finale
9. boss_drago_rosso_5_3 | "Scaglie Dure come Diamante" | Tema: difesa assoluta

#### Boss: Drago Verde
10. boss_drago_verde_5_1 | "Astuzia Draconica" | Tema: intelligenza, strategia
11. boss_drago_verde_5_2 | "Bosco Primordiale" | Tema: natura, foresta
12. boss_drago_verde_5_3 | "Simbiosi Magica" | Tema: armonia, simbiosi

#### Boss: Drago Comune
13. boss_drago_comune_5_1 | "Potenza Draconica" | Tema: forza drago
14. boss_drago_comune_5_2 | "Volo Alto" | Tema: ascesa, trono
15. boss_drago_comune_5_3 | "Fuoco e Fumo" | Tema: elementi

#### Boss: Kraken
16. boss_kraken_5_1 | "Profondità Abissali" | Tema: abisso, profondità

#### Boss: Leviatano
17. boss_leviatano_5_1 | "Caos Primordiale" | Tema: caos primordiale
18. boss_leviatano_5_2 | "Creatura Ancestrale" | Tema: ancestrale, primordiale

---

## Output Atteso

JSON con struttura:
```json
{
  "boss_missions": {
    "goblin": {
      "1": [
        {
          "id": "boss_goblin_1_1",
          "title": "I Tesori Nascosti",
          "text": "Il piccolo Goblin custodisce uno scrigno colmo di ricchezze rubate. Non puoi prenderlo con la forza: questi piccoli furbi amano i giochi d'astuzia. Inganna il mercante goblin con una storia brillante. Cosa racconti per fargli aprire il suo scrigno?"
        },
        ...
      ]
    },
    ...
  }
}
```

---

## NOTE IMPORTANTI

1. **Mantieni coerenza tematica**: ogni missione deve riflettere il boss e il tema specifico
2. **Tono per difficoltà**: usa il tono appropriato per ogni livello (facile/medium/hard/expert/legendary)
3. **Lunghezza**: 50-80 parole circa per missione
4. **Linguaggio**: secondo person, imperativo, italiano
5. **Hook chiaro**: la sfida deve essere subito evidente
6. **Niente bonus**: niente menziona di badge, reward, XP (è background)
7. **Ambiente coerente**: il giocatore è in questa settimana speciale con la sua gilda vs il boss
