// CSS 코드
var styleCode = `
    ul,
    li {
        list-style-type: none;
        color: black;
    }

    a {
        text-decoration: none;
        color: black;
    }

    div {
        font-family: Arial, Helvetica, sans-serif;
    }

    #TopMenu nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        font-weight: bold;
    }

    #TopMenu ul {
        display: flex;
    }

    #TopMenu ul li {
        margin-left: 20px;
        line-height: 32px;
    }

    #Btn_LogOut {
        padding: 4px 12px;
        font-size: 15px;
        font-weight: bold;
        background-color: rgba(128, 128, 128, 0.685);
        border-radius: 20px;
        border: none;
    }

    #Btn_LogOut:hover {
        background-color: black;
        color: white;
    }

    #Logo {
        font-size: 22px;
    }

    #Logo img {
        height: 40px;
        vertical-align: middle;
    }

    #world_map{
        border: 1px solid black;
        left: 250px;
        width: 750px;
        height: 500px;
        position: absolute;
    }

    #choice_country{
        width: 200px;
        height: 500px;
        position: absolute;
    }
`;

// 스타일 요소 생성
var styleElement = document.createElement('style');
styleElement.innerHTML = styleCode;

// head에 스타일 요소 추가
document.head.appendChild(styleElement);


var selectedCountries = [];
var chart; // chart 변수를 전역 범위로 이동

// 드롭다운에서 선택한 국가를 추가하고, 밑에 디스플레이로 전달함
function highlightCountry() {
    var countryDropdown = document.getElementById("countryDropdown");
    var selectedCountry = countryDropdown.value;

    // 서버에 저장된 모든 국가 코드 불러오기
    fetch("/worldmap/allSelectedCountries")
        .then(response => response.json())
        .then(loadCountries => {
            // DB에 저장된 국가 코드 목록
            var savedCountryCodes = loadCountries.map(country => country.selectedCountry);
            // 24.02.29 선택한 국가 코드가 이미 DB에 저장되어 있는지 확인
            if (savedCountryCodes.includes(selectedCountry)) {
                console.log("이미 선택된 국가입니다.");
            } else {
                if (selectedCountry !== "") {
                    selectedCountries.push(selectedCountry);
                    console.log("selectedCountries 5 :", selectedCountries);
                    console.log("selectedCountry 5:", selectedCountry);
                    loadSelectedCountry();
                    sendSelectedCountry(selectedCountry);
                }
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });

    countryDropdown.value = "";
}

// 24.02.01 db데이터 -> 뷰어에서 추가하는 함수
function loadSelectedCountry() {
    var selectedCountriesDiv = document.getElementById("selectedCountries");
    selectedCountriesDiv.innerHTML = "";

    fetch("/worldmap/allSelectedCountries")
        .then(response => response.json())
        .then(loadCountries => {
            loadCountries.forEach(country => {
                var countryDiv = document.createElement("div");
                var selectedCountry = country.selectedCountry;
                var countryName = getCountryName(selectedCountry);
                //var countryName = getCountryName(country.code);
                countryDiv.innerHTML = countryName + " <button onclick='removeCountry(\"" + selectedCountry + "\")'>x</button>";
                selectedCountriesDiv.appendChild(countryDiv);
            });
            updateCountryColors();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}


// 뷰어에서 x버튼 누르면 data를 여부를 확인하여 삭제함수로 전달
function removeCountry(selectedCountry) {
    if (!selectedCountry) {
        return; // 국가가 선택되지 않은 경우 함수 종료
    }
    var index = selectedCountries.indexOf(selectedCountry);
    console.log("selectedCountries 2 :", selectedCountries);
    console.log("index :", index);
    console.log("selectedCountry :", selectedCountry);
    if (index !== -1) {
        selectedCountries.splice(index, 1);
        //updateSelectedCountries();
        sendRemoveRequest(selectedCountry); // 데이터베이스에서 제거 요청을 보내는 새로운 함수
        console.log("선택된 국가들:", selectedCountry);
    }
}

// 서버에서 가져온 데이터로 뷰어 업데이트
function updateCountryColors() {
    var polygonSeries = chart.series.values[0];
    polygonSeries.mapPolygons.each(function (polygon) {
        var countryCode = polygon.dataItem.dataContext.id;
        polygon.fill = selectedCountries.indexOf(countryCode) !== -1 ? am4core.color("#FFDF7B") : am4core.color("#A2A6A1");
    });
}

// loadSelectedCountry 함수 호출
loadSelectedCountry();


//약어 -> 한국어, 추후에 db에서 꺼낼수 있으면 이 코드를 지우고 db에서 꺼내는 쿼리문 작성 ㄱㄱ 예정
function getCountryName(selectedCountry) {
    switch (selectedCountry) {
        case "KR":
            return "한국";
        case "US":
            return "미국";
        case "CN":
            return "중국";
        default:
            return "";
    }
}

// 추가한 국가를 db로 보내는 함수
function sendSelectedCountry(selectedCountry) {
    fetch("/worldmap", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            selectedCountry: selectedCountry
        }),
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Network response was not ok');
        }
    })
    .then(data => {
        console.log('Success:', data);
        loadSelectedCountry(); // 성공적인 응답 후에 호출
    })
    .catch((error) => {
        console.error('Error:', error);
        console.error('Response:', error.response); // 서버 응답에 대한 상세 정보 출력
    });
}

// 24.02.28 x버튼을 누르면 db에서 국가를 제거하기 위해 요청을 보내는 함수
function sendRemoveRequest(selectedCountry) {
    console.log("삭제 요청 보냄:", selectedCountry);
    fetch(`/worldmap/removeCountry/${selectedCountry}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}


// 지도함수
am4core.ready(function () {
    chart = am4core.create("world_map", am4maps.MapChart);
    chart.geodata = am4geodata_worldLow;

    var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
    polygonSeries.useGeodata = true;
    polygonSeries.exclude = ["AQ"];

    var polygonTemplate = polygonSeries.mapPolygons.template;
    polygonTemplate.tooltipText = "{name}";

    polygonTemplate.propertyFields.fill = function (dataItem) {
        return selectedCountries.indexOf(dataItem.id) !== -1 ? am4core.color("#FFDF7B") : am4core.color("#A2A6A1");
    };

    polygonTemplate.events.on("hit", function (event) {
        var selectedPolygon = event.target;
        var countryCode = selectedPolygon.dataItem.dataContext.id;

        if (selectedCountries.indexOf(countryCode) === -1) {
            selectedCountries.push(countryCode);
            updateSelectedCountries();
        }

        updateCountryColors();
    });

    chart.deltaLongitude = -10;
    chart.zoomControl = new am4maps.ZoomControl();
});

function updateCountryColors() {
    var polygonSeries = chart.series.values[0];
    polygonSeries.mapPolygons.each(function (polygon) {
        var countryCode = polygon.dataItem.dataContext.id;
        polygon.fill = selectedCountries.indexOf(countryCode) !== -1 ? am4core.color("#FFDF7B") : am4core.color("#A2A6A1");
    });
}






