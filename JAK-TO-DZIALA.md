# Jak zbudowana jest strona VANTA Observatory

## 1. Co powstało

VANTA Observatory jest kompletną stroną fikcyjnego, prywatnego obserwatorium astronomicznego. Temat został wybrany celowo: odróżnia projekt zarówno od restauracji EMBER, jak i biznesowego systemu SCALE/OS.

Projekt nie kopiuje żadnej istniejącej strony. Korzysta z ogólnych zasad widocznych w najlepszych realizacjach internetowych: mocna typografia, jedna dominująca idea wizualna, animacja wspierająca opowieść, nietypowa nawigacja i płynne przejścia. Główną ideą VANTA jest ciemność, która ujawnia informacje.

## 2. Jak przeglądarka buduje stronę

Przeglądarka otrzymuje trzy główne pliki:

1. `public/index.html` opisuje treść i strukturę.
2. `public/styles.css` określa wygląd, układ i animacje.
3. `public/app.js` dodaje interakcje oraz komunikację z serwerem.

HTML działa jak szkielet budynku. CSS odpowiada za materiały, kolory, rozmiary i ruch. JavaScript jest instalacją elektryczną: reaguje na kliknięcia, przewijanie i dane formularza.

## 3. Frontend

### HTML

Strona jest podzielona na logiczne sekcje:

- hero z czarną dziurą,
- analizator kosmicznego sygnału,
- trzy karty ekspedycji,
- manifest marki,
- prezentacja instrumentu,
- formularz rezerwacji,
- stopka.

Zastosowano semantyczne znaczniki, między innymi `header`, `nav`, `main`, `section`, `article`, `form` i `footer`. Dzięki temu strona jest czytelniejsza dla wyszukiwarek i technologii wspomagających.

### CSS

CSS wykorzystuje:

- Grid i Flexbox do budowania układu,
- zmienne CSS dla kolorów i fontów,
- media queries do wersji mobilnej,
- animacje `transform` i `opacity`, które są wydajne,
- perspektywę 3D do teleskopu i czarnej dziury,
- `prefers-reduced-motion`, aby ograniczyć ruch osobom, które tego potrzebują.

Czarna dziura nie jest filmem ani obrazkiem. Powstaje z warstw CSS: gradientów, elips, rozmycia, cieni i obrotu w przestrzeni 3D.

### JavaScript

JavaScript obsługuje:

- ekran startowy,
- pole gwiazd na Canvas 2D,
- ruch czarnej dziury względem kursora,
- zegar UTC,
- pojawianie się treści podczas przewijania,
- wizualizację sygnału,
- talię kart ekspedycji,
- okno szczegółów ekspedycji,
- zmianę ustawienia teleskopu podczas przewijania,
- opcjonalne subtelne dźwięki,
- walidację i wysyłanie formularza.

Canvas działa jak płótno. JavaScript rysuje na nim każdą gwiazdę i każdą klatkę wykresu. Nie wymaga to pobierania filmu ani ciężkiej biblioteki 3D.

## 4. Backend

Plik `server.py` uruchamia serwer HTTP w Pythonie. Korzysta wyłącznie ze standardowej biblioteki, więc nie wymaga instalowania Flask, Django ani innych paczek.

Serwer robi trzy rzeczy:

1. wysyła do przeglądarki pliki strony,
2. odbiera formularze rezerwacji przez `POST /api/visits`,
3. pozwala administratorowi pobrać zgłoszenia przez chronione `GET /api/visits`.

Po poprawnym wysłaniu formularza serwer:

1. sprawdza format i wielkość żądania,
2. oczyszcza pola tekstowe,
3. waliduje email, datę, liczbę osób i rodzaj ekspedycji,
4. generuje losowy identyfikator,
5. zapisuje dane atomowo do `data/visits.json`,
6. zwraca przeglądarce potwierdzenie.

## 5. Zabezpieczenia

Projekt ma zabezpieczenia odpowiednie dla demonstracyjnej strony portfolio:

- **Content Security Policy:** przeglądarka może ładować skrypty, style i połączenia tylko z tej samej strony.
- **Ochrona przed osadzaniem:** `X-Frame-Options: DENY` i `frame-ancestors 'none'` utrudniają clickjacking.
- **Blokada sniffingu MIME:** `X-Content-Type-Options: nosniff`.
- **Ograniczone uprawnienia:** strona nie może korzystać z kamery, mikrofonu ani lokalizacji.
- **Walidacja po stronie klienta i serwera:** backend nigdy nie ufa danym przysłanym z przeglądarki.
- **Limit rozmiaru żądania:** formularz nie może wysłać dowolnie dużej ilości danych.
- **Rate limiting:** jeden adres IP może wysłać maksymalnie osiem żądań na minutę.
- **Porównanie klucza w stałym czasie:** klucz administratora jest sprawdzany przez `hmac.compare_digest`.
- **Brak danych w Git:** plik z rezerwacjami jest wymieniony w `.gitignore`.
- **Atomowy zapis:** nowy plik najpierw powstaje tymczasowo, a potem zastępuje stary, co ogranicza ryzyko uszkodzenia danych.
- **Brak trackerów i CDN:** żadna firma zewnętrzna nie otrzymuje informacji o odwiedzających.

W prawdziwej firmie należy dodatkowo użyć HTTPS, profesjonalnej bazy danych, kopii zapasowych, systemu logowania administratora i zgodnej z prawem polityki prywatności.

## 6. Jak formularz łączy frontend z backendem

Po kliknięciu „Wyślij prośbę” JavaScript tworzy obiekt JSON i wysyła go metodą `POST`:

```text
Przeglądarka -> POST /api/visits -> Python -> walidacja -> plik JSON
```

Serwer odpowiada kodem:

- `201`, gdy zapis się udał,
- `422`, gdy pola są niepoprawne,
- `429`, gdy wysłano za dużo prób,
- `400`, gdy samo żądanie jest uszkodzone.

JavaScript odczytuje odpowiedź i pokazuje użytkownikowi potwierdzenie albo dokładny błąd.

## 7. Dlaczego bez frameworka

Strona celowo używa czystego HTML, CSS, JavaScriptu i Pythona:

- łatwo ją uruchomić,
- ma mało zależności,
- szybko się ładuje,
- pokazuje znajomość podstaw technologii,
- nie przestanie działać po aktualizacji zewnętrznej biblioteki.

Framework byłby przydatny przy dużym panelu użytkownika, setkach podstron albo pracy wieloosobowego zespołu. Tutaj zwiększyłby rozmiar i złożoność bez wyraźnej korzyści.

## 8. Pliki projektu

```text
vanta-observatory/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── data/
│   └── .gitkeep
├── tests/
│   └── test_server.py
├── server.py
├── README.md
├── JAK-TO-DZIALA.md
└── .gitignore
```

## 9. Uruchomienie na Windows 11

1. Pobierz projekt i rozpakuj folder.
2. Otwórz folder w Eksploratorze plików.
3. Kliknij pasek adresu, wpisz `cmd` i naciśnij Enter.
4. Wpisz `python server.py`.
5. Otwórz w przeglądarce `http://127.0.0.1:8002`.
6. Serwer zatrzymasz skrótem `Ctrl+C`.

Samo otwarcie `index.html` pokaże wygląd strony, ale formularz nie będzie mógł zapisywać danych. Do kompletnego działania potrzebny jest `server.py`.

## 10. Co można dodać w wersji produkcyjnej

- prawdziwe terminy i kalendarz dostępności,
- płatności,
- wysyłkę emaili,
- panel administratora,
- bazę PostgreSQL,
- hosting z HTTPS,
- domenę i pocztę,
- politykę prywatności oraz mechanizm usuwania danych.
