function formatDate(date){
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
}

let selectedDate = new Date();
let selectedTimezone = "Asia/Kolkata";



/* ================= TAB SWITCH ================= */

function showSection(id, el){

    document.querySelectorAll(".section").forEach(s=>s.classList.remove("active-section"));
    document.getElementById(id).classList.add("active-section");

    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    if(el) el.classList.add("active");

    if(id==="analytics"){
        generateAnalytics();
    }
}



/* ================= INITIAL LOAD ================= */

document.addEventListener("DOMContentLoaded",()=>{
    initTimezone();
    initYearMonthSelectors();
    updateClock();
    setInterval(updateClock,1000);
    loadExpensesForDate();
    generateCalendar();
    updateBudgetDisplay();
});

/* ================= SEARCH ================= */

function filterExpenses(){

    const searchText =
        document.getElementById("searchExpense")
        .value
        .toLowerCase();

    const listItems =
        document.querySelectorAll("#expenseList li");

    listItems.forEach(li=>{

        const text =
            li.textContent.toLowerCase();

        if(text.includes(searchText)){
            li.style.display="flex";
        }else{
            li.style.display="none";
        }

    });
}


/* ================= TIMEZONE ================= */

function initTimezone(){
    const tz = document.getElementById("timezoneSelect");
    const zones=[
        "Asia/Kolkata",
        "UTC",
        "America/New_York",
        "Europe/London"
    ];

    zones.forEach(z=>{
        let opt=document.createElement("option");
        opt.value=z;
        opt.textContent=z;
        tz.appendChild(opt);
    });

    tz.value=selectedTimezone;

    tz.onchange=()=>{
        selectedTimezone=tz.value;
        updateClock();
    };
}

/* ================= CLOCK ================= */

function updateClock(){
    const now=new Date();

    document.getElementById("liveTime").textContent =
        now.toLocaleTimeString("en-IN",{
            timeZone:selectedTimezone,
            hour:"2-digit",
            minute:"2-digit",
            second:"2-digit"
        });

    document.getElementById("liveDate").textContent =
        selectedDate.toLocaleDateString("en-GB");
}

/* ================= STORAGE ================= */

function getExpenses(){

    try{
        const stored = JSON.parse(
            localStorage.getItem("expenses")
        );

        if(!Array.isArray(stored)){
            return [];
        }

        return stored;
    }
    catch(error){

        console.error("Unable to read expenses:", error);
        return [];
    }
}


function saveExpenses(data){

    localStorage.setItem(
        "expenses",
        JSON.stringify(data)
    );
}


/* ================= BUDGET ================= */

function getBudgetKey(date = selectedDate){

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2,"0");

    return `monthlyBudget_${year}-${month}`;
}


function getBudget(){

    const monthKey = getBudgetKey();

    const value = parseFloat(
        localStorage.getItem(monthKey)
    );

    return isNaN(value) ? 0 : value;
}


function saveBudget(){

    const input = document.getElementById("budgetInput");

    const value = parseFloat(input.value);

    if(isNaN(value) || value < 0){

        showToast(
            "Please enter a valid monthly budget."
        );

        return;
    }

    localStorage.setItem(
        getBudgetKey(),
        value
    );

    updateBudgetDisplay();

    showToast(
        "Monthly budget saved."
    );
}


function updateBudgetDisplay(){

    const totalElement =
        document.getElementById("totalAmount");

    const remainingElement =
        document.getElementById("remainingAmount");

    const progressBar =
        document.getElementById("budgetProgress");

    const progressLabel =
        document.getElementById("progressLabel");

    const budgetInput =
        document.getElementById("budgetInput");

    const total =
        parseFloat(totalElement.textContent) || 0;

    const budget = getBudget();

    budgetInput.value =
        budget > 0 ? budget : "";

    if(budget <= 0){

        remainingElement.textContent =
            "0.00";

        remainingElement.style.color =
            "#333";

        progressBar.style.width =
            "0%";

        progressLabel.textContent =
            "Set a monthly budget to track progress.";

        return;
    }

    const remaining =
        budget - total;

    remainingElement.textContent =
        remaining.toFixed(2);

    if(remaining < 0){

        remainingElement.style.color =
            "#b3261e";

        progressLabel.textContent =
            `Budget exceeded by ₹${Math.abs(remaining).toFixed(2)}`;

    }
    else{

        remainingElement.style.color =
            "#4f5d2f";

        progressLabel.textContent =
            `₹${remaining.toFixed(2)} remaining`;
    }

    const percentage =
        Math.min((total / budget) * 100, 100);

    progressBar.style.width =
        `${percentage}%`;
}

/* ================= ADD EXPENSE ================= */

function addExpense(){

    const desc =
        document.getElementById("description")
        .value
        .trim();

    const amt =
        parseFloat(
            document.getElementById("amount").value
        );

    let category =
        document.getElementById("category").value;

    const custom =
        document.getElementById("customCategory")
        .value
        .trim();

    const paymentMethod =
        document.getElementById("paymentMethod").value;


    /* VALIDATION */

    if(!desc){

        showToast(
            "Please enter an expense description."
        );

        document.getElementById("description").focus();

        return;
    }


    if(isNaN(amt) || amt <= 0){

        showToast(
            "Please enter a valid amount."
        );

        document.getElementById("amount").focus();

        return;
    }


    if(!category){

        showToast(
            "Please select a category."
        );

        return;
    }


    if(category === "Other"){

        if(!custom){

            showToast(
                "Please enter a custom category."
            );

            document.getElementById("customCategory").focus();

            return;
        }

        category = custom;
    }


    if(!paymentMethod){

        showToast(
            "Please select a payment method."
        );

        return;
    }


    /* CREATE EXPENSE */

    const now = new Date();

    const exp = {

        id: Date.now(),

        description: desc,

        category: category,

        amount: amt,

        paymentMethod: paymentMethod,

        date: formatDate(selectedDate),

        time: now.toLocaleTimeString(
            "en-IN",
            {
                timeZone: selectedTimezone,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        )
    };


    const data = getExpenses();

    data.push(exp);

    saveExpenses(data);


    /* RESET FORM */

    document.getElementById("description").value = "";

    document.getElementById("amount").value = "";

    document.getElementById("category").value = "";

    document.getElementById("paymentMethod").value = "";

    document.getElementById("customCategory").value = "";

    handleCategoryChange();


    /* REFRESH UI */

    loadExpensesForDate();

    generateCalendar();

    generateAnalytics();

    showToast(
        "Expense added successfully."
    );


    document.getElementById("description").focus();
}

/* ================= CATEGORY HANDLING ================= */

function handleCategoryChange(){

    const cat =
        document.getElementById("category").value;

    const custom =
        document.getElementById("customCategory");

    const customField =
        document.getElementById("customCategoryField");


    if(cat === "Other"){

        customField.style.display = "flex";

        custom.focus();

    }
    else{

        customField.style.display = "none";

        custom.value = "";
    }
}


/* ================= QUICK CATEGORY ================= */

function selectQuickCategory(category){

    const select =
        document.getElementById("category");

    select.value = category;

    handleCategoryChange();

    document.getElementById("description").focus();
}

/* ================= LOAD EXPENSES ================= */

function loadExpensesForDate(){

    const list =
        document.getElementById("expenseList");

    list.innerHTML = "";


    const key =
        formatDate(selectedDate);


    const data =
        getExpenses()
        .filter(e => e.date === key);


    let total = 0;

    let upiTotal = 0;

    let cashTotal = 0;

    let cardTotal = 0;


    data.forEach(e => {

        total += Number(e.amount) || 0;


        /* Support old expenses */

        const payment =
            e.paymentMethod || "Other";


        if(payment === "UPI"){
            upiTotal += Number(e.amount) || 0;
        }

        if(payment === "Cash"){
            cashTotal += Number(e.amount) || 0;
        }

        if(payment === "Card"){
            cardTotal += Number(e.amount) || 0;
        }


        const li =
            document.createElement("li");


        li.innerHTML = `

            <div class="expense-left">

                <div class="expense-title">
                    ${escapeHTML(e.description)}
                    -
                    ₹${Number(e.amount).toFixed(2)}
                </div>

                <div class="expense-category">
                    Category: ${escapeHTML(e.category)}
                </div>

                <div class="expense-payment">
                    Payment: ${escapeHTML(payment)}
                </div>

            </div>


            <div class="expense-right">

                <div class="expense-datetime">
                    ${e.date} | ${e.time}
                </div>

                <button
                    class="edit-btn"
                    onclick="editExpense(${e.id})">
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteExpense(${e.id})">
                    Delete
                </button>

            </div>
        `;


        list.appendChild(li);
    });


    document.getElementById("totalAmount")
        .textContent = total.toFixed(2);


    document.getElementById("todaySpentAmount")
        .textContent = total.toFixed(2);


    document.getElementById("todayExpenseCount")
        .textContent =
        `${data.length} expense${data.length === 1 ? "" : "s"}`;


    document.getElementById("todayUpiAmount")
        .textContent = upiTotal.toFixed(2);


    document.getElementById("todayCashAmount")
        .textContent = cashTotal.toFixed(2);


    document.getElementById("todayCardAmount")
        .textContent = cardTotal.toFixed(2);


    updateSelectedDateLabel();

    updateBudgetDisplay();
}

/* ================= HTML SAFETY ================= */

function escapeHTML(value){

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ================= SELECTED DATE ================= */

function updateSelectedDateLabel(){

    const element =
        document.getElementById("selectedDateLabel");

    if(!element) return;


    const isToday =
        formatDate(selectedDate) ===
        formatDate(new Date());


    const formatted =
        selectedDate.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    element.textContent =
        isToday
            ? `Today • ${formatted}`
            : `Adding expense for ${formatted}`;
}

/* ================= DELETE ================= */

function deleteExpense(id){

    const confirmDelete = confirm("Are you sure you want to delete this expense?");
    if(!confirmDelete) return;

    const data = getExpenses().filter(e => e.id !== id);

    saveExpenses(data);

    loadExpensesForDate();
    generateCalendar();
    generateAnalytics();
}


/* ================= CALENDAR ================= */

function generateCalendar(){

    const grid=document.getElementById("calendarGrid");
    grid.innerHTML="";

    const year=selectedDate.getFullYear();
    const month=selectedDate.getMonth();
    const today=new Date();

    const firstDay=new Date(year,month,1).getDay();
    const daysInMonth=new Date(year,month+1,0).getDate();
    const data=getExpenses();

    const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    days.forEach(d=>{
        let h=document.createElement("div");
        h.className="day-header";
        h.textContent=d;
        grid.appendChild(h);
    });

    for(let i=0;i<firstDay;i++){
        grid.appendChild(document.createElement("div"));
    }

    let monthlyTotal=0;

    for(let day=1;day<=daysInMonth;day++){

        const dObj=new Date(year,month,day);
        const key=formatDate(dObj);

        const daily=data
            .filter(e=>e.date===key)
            .reduce((s,e)=>s+e.amount,0);

        const budget = getBudget();

let heatColor = "#ffffff"; // default white

if(budget > 0){

const percent = (daily / budget) * 100;

if(percent >= 75){
heatColor = "#ffd6d6"; // light red
}
else if(percent >= 50){
heatColor = "#ffe5b4"; // light orange
}
else if(percent >= 25){
heatColor = "#fff3b0"; // light yellow
}

}  

        monthlyTotal+=daily;

        const box=document.createElement("div");
        box.className="calendar-day";

        box.style.backgroundColor = heatColor;

        // Highlight selected day
        if(dObj.toDateString() === selectedDate.toDateString()){
            box.classList.add("selected-day");
        }

        // Highlight today's date
        if(dObj.toDateString() === today.toDateString()){
            box.classList.add("today-day");
        }

        box.innerHTML=`
            <div class="date-number">${day}</div>
            <div class="date-amount">₹ ${daily.toFixed(2)}</div>
        `;

        box.onclick=()=>{
        selectedDate=dObj;
        generateCalendar();
        showDayPopup(dObj);
    };

        grid.appendChild(box);
    }

    document.getElementById("monthlyTotal").textContent =
        monthlyTotal.toFixed(2);
    
    updateMonthSummary();
    updateSelectedDateLabel();
}

let pieChart;
let barChart;
let paymentChart;

function generateAnalytics(){

    const data = getExpenses();


    if(!data.length){

        if(pieChart){
            pieChart.destroy();
            pieChart = null;
        }

        if(barChart){
            barChart.destroy();
            barChart = null;
        }

        if(paymentChart){
            paymentChart.destroy();
            paymentChart = null;
        }

        clearInsights();

        return;
    }


    generatePieChart(data);

    generateBarChart(data);

    generatePaymentChart(data);

    generateInsights(data);

    changeAnalyticsView();
}

/* ================= ANALYTICS VIEW ================= */

function changeAnalyticsView(){

    const selector =
        document.getElementById("analyticsSelector");

    if(!selector) return;


    const selected =
        selector.value;


    const views = {
        category:
            document.getElementById("categoryChartBox"),

        daily:
            document.getElementById("dailyChartBox"),

        payment:
            document.getElementById("paymentChartBox")
    };


    Object.values(views).forEach(view => {

        if(view){
            view.classList.remove("active");
        }

    });


    if(views[selected]){
        views[selected].classList.add("active");
    }

}

/* ================= PIE CHART ================= */

function generatePieChart(data){

    const categoryTotals = {};


    data.forEach(exp => {

        const category =
            exp.category || "Other";

        const amount =
            Number(exp.amount) || 0;


        if(!categoryTotals[category]){
            categoryTotals[category] = 0;
        }

        categoryTotals[category] += amount;
    });


    const sortedCategories =
    Object.entries(categoryTotals)
    .sort((a,b) => b[1] - a[1]);


    const labels =
        sortedCategories.map(item => item[0]);

    const values =
        sortedCategories.map(item => item[1]);


    const ctx =
        document.getElementById("pieChart")
        .getContext("2d");


    if(pieChart){
        pieChart.destroy();
    }


    pieChart = new Chart(ctx, {

        type: "pie",

        data: {

            labels: labels,

            datasets: [{

                data: values,

                backgroundColor: [
                    "#4f5d2f",
                    "#7d8f69",
                    "#c6a000",
                    "#a3b18a",
                    "#588157",
                    "#344e41",
                    "#8d6e63",
                    "#607d8b",
                    "#9c6644",
                    "#6d6875"
                ]
            }]
        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

/* ================= PAYMENT CHART ================= */

function generatePaymentChart(data){

    const paymentTotals = {

        UPI: 0,

        Cash: 0,

        Card: 0,

        Other: 0
    };


    data.forEach(exp => {

        const payment =
            exp.paymentMethod || "Other";

        const amount =
            Number(exp.amount) || 0;


        if(paymentTotals[payment] !== undefined){

            paymentTotals[payment] += amount;

        }
        else{

            paymentTotals.Other += amount;
        }
    });


    const paymentEntries =
    Object.entries(paymentTotals)
    .filter(([method, amount]) => amount > 0);


const labels =
    paymentEntries.map(entry => entry[0]);

const values =
    paymentEntries.map(entry => entry[1]);


    const ctx =
        document.getElementById("paymentChart")
        .getContext("2d");


    if(paymentChart){
        paymentChart.destroy();
    }


    paymentChart = new Chart(ctx, {

        type: "doughnut",

        data: {

            labels: labels,

            datasets: [{

                data: values,

                backgroundColor: [
                    "#4f5d2f",
                    "#7d8f69",
                    "#c6a000",
                    "#a3b18a"
                ]
            }]
        },

        options: {

    responsive: true,

    maintainAspectRatio: true,

    aspectRatio: 1.35,

    plugins: {

        legend: {

            position: "bottom",

            labels: {

                boxWidth: 18,
                boxHeight: 12,

                padding: 12,

                font: {
                    size: 12
                }
            }
        }
    }
}
    });
}


/* BAR CHART */

function generateBarChart(data){

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month+1, 0).getDate();

    const dailyTotals = new Array(daysInMonth).fill(0);

    data.forEach(exp=>{
        const d = new Date(exp.date);
        if(d.getMonth()===month && d.getFullYear()===year){
            dailyTotals[d.getDate()-1] += exp.amount;
        }
    });

    const labels = dailyTotals.map((_,i)=>i+1);

    const ctx = document.getElementById("barChart").getContext("2d");

    if(barChart) barChart.destroy();

    barChart = new Chart(ctx,{
        type:"bar",
        data:{
            labels:labels,
            datasets:[{
                label:"₹ Spending",
                data:dailyTotals,
                backgroundColor:"#4f5d2f"
            }]
        },
        options:{
            responsive:true,
            scales:{
                y:{
                    beginAtZero:true
                }
            }
        }
    });
}

/* ================= CATEGORY FILTER ================= */

function filterCategory(category){

    const items = document.querySelectorAll("#expenseList li");

    items.forEach(li => {

        const text = li.textContent;

        if(category === "All"){
            li.style.display = "flex";
        }
        else if(text.includes(category)){
            li.style.display = "flex";
        }
        else{
            li.style.display = "none";
        }

    });

}

/* ================= CALENDAR POPUP ================= */

function showDayPopup(dateObj){

    const key = formatDate(dateObj);
    const data = getExpenses().filter(e => e.date === key);

    const popup = document.getElementById("dayPopup");
    const list = document.getElementById("popupExpenseList");

    popup.style.display = "flex";

    const formattedDate = dateObj.toLocaleDateString("en-GB",{
    weekday:"long",
    day:"numeric",
    month:"long",
    year:"numeric"
    });

    const formattedTime = new Date().toLocaleTimeString("en-IN",{
        hour:"2-digit",
        minute:"2-digit",
        hour12:true,
        timeZone:selectedTimezone
    });

    document.getElementById("popupDate").textContent =
    `${formattedDate} • ${formattedTime}`;

    list.innerHTML = "";

    let total = 0;

    data.forEach(e => {

        total += e.amount;

        const li = document.createElement("li");

        li.innerHTML = `
            <span>${e.description}</span>
            <span>₹ ${e.amount.toFixed(2)}</span>
        `;

        list.appendChild(li);
    });

    document.getElementById("popupTotal").textContent =
        total.toFixed(2);
}

function closeDayPopup(){
    document.getElementById("dayPopup").style.display="none";
}

/* ================= MONTH SUMMARY ================= */

function updateMonthSummary(){

    const data = getExpenses();

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    let monthlyExpenses = data.filter(e=>{
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    if(!monthlyExpenses.length){
        document.getElementById("summaryTotal").textContent="0";
        document.getElementById("summaryAverage").textContent="0";
        document.getElementById("summaryHighest").textContent="₹0";
        return;
    }

    let total = 0;
    let dailyTotals = {};

    monthlyExpenses.forEach(e=>{

        total += e.amount;

        if(!dailyTotals[e.date]){
            dailyTotals[e.date] = 0;
        }

        dailyTotals[e.date] += e.amount;

    });

    let highestDay = Object.entries(dailyTotals)
        .sort((a,b)=>b[1]-a[1])[0];

    const avg = total / Object.keys(dailyTotals).length;

    document.getElementById("summaryTotal")
        .textContent = total.toFixed(2);

    document.getElementById("summaryAverage")
        .textContent = avg.toFixed(2);

    document.getElementById("summaryHighest")
        .textContent =
        `₹${highestDay[1].toFixed(2)} (${highestDay[0]})`;

    const budget = getBudget();

    if(budget > 0){
        const status =
            total > budget
            ? "Over Budget ❌"
            : "Within Budget ✔";

        document.getElementById("summaryBudget")
            .textContent = status;
    }
}

/* ================= YEAR & MONTH SELECT ================= */

function initYearMonthSelectors(){

    const yearSelect = document.getElementById("yearSelect");
    const monthSelect = document.getElementById("monthSelect");

    if(!yearSelect || !monthSelect) return;

    const months = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];

    /* Populate Months */

    months.forEach((m,i)=>{
        const opt=document.createElement("option");
        opt.value=i;
        opt.textContent=m;
        monthSelect.appendChild(opt);
    });

    /* Populate Years */

    for(let y=2020;y<=2040;y++){
        const opt=document.createElement("option");
        opt.value=y;
        opt.textContent=y;
        yearSelect.appendChild(opt);
    }

    /* Set current values */

    monthSelect.value = selectedDate.getMonth();
    yearSelect.value = selectedDate.getFullYear();

    /* Change Month */

    monthSelect.onchange = ()=>{

    selectedDate.setMonth(
        parseInt(monthSelect.value)
    );

    loadExpensesForDate();

    generateCalendar();

    generateAnalytics();

    updateBudgetDisplay();
};
    

    /* Change Year */

   yearSelect.onchange = ()=>{

    selectedDate.setFullYear(
        parseInt(yearSelect.value)
    );

    loadExpensesForDate();

    generateCalendar();

    generateAnalytics();

    updateBudgetDisplay();
};
}

/* ================= SMART INSIGHTS ================= */

function generateInsights(data){

    if(!data.length) return;

    /* Top Category */

    const categoryTotals={};

    data.forEach(e=>{

    const category =
        e.category || "Other";

    const amount =
        Number(e.amount) || 0;

    if(!categoryTotals[category]){
        categoryTotals[category] = 0;
    }

    categoryTotals[category] += amount;
});

    const topCategory =
        Object.entries(categoryTotals)
        .sort((a,b)=>b[1]-a[1])[0];

    document.getElementById("insightCategory")
        .textContent = `${topCategory[0]} (₹${topCategory[1].toFixed(2)})`;



    /* Highest Spending Day */

    const dailyTotals={};

    data.forEach(e=>{
        if(!dailyTotals[e.date]){
            dailyTotals[e.date]=0;
        }
        dailyTotals[e.date]+=e.amount;
    });

    const highestDay =
        Object.entries(dailyTotals)
        .sort((a,b)=>b[1]-a[1])[0];

    document.getElementById("insightHighestDay")
        .textContent = `₹${highestDay[1].toFixed(2)} on ${highestDay[0]}`;



    /* Average Daily */

    const total = data.reduce((sum,e)=>sum+e.amount,0);

    const avg =
        total / Object.keys(dailyTotals).length;

    document.getElementById("insightAverage")
        .textContent = `₹ ${avg.toFixed(2)}`;



    /* Largest Expense */

    const largest =
        data.sort((a,b)=>b.amount-a.amount)[0];

    document.getElementById("insightLargest")
        .textContent = `${largest.description} (₹${largest.amount.toFixed(2)})`;



    /* Smart Message */

    let msg="";

    if(avg > 2000){
        msg="You are spending heavily. Consider reducing daily expenses.";
    }
    else if(avg > 500){
        msg="Your spending is moderate.";
    }
    else{
        msg="Great control over spending!";
    }

    document.getElementById("insightMessage")
        .textContent = msg;

}

/* ================= EXPORT TO EXCEL ================= */

function exportToExcel(){

    const data = getExpenses();

    if(!data.length){
        alert("No expenses to export");
        return;
    }

    const formattedData = data.map(e=>({
        Date: e.date,
        Time: e.time,
        Description: e.description,
        Category: e.category,
        Amount: e.amount
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    XLSX.writeFile(workbook, "Expense_Report.xlsx");

}

/* ================= TOAST ================= */

function showToast(message){

    let toast =
        document.getElementById("appToast");


    if(!toast){

        toast =
            document.createElement("div");

        toast.id = "appToast";

        document.body.appendChild(toast);
    }


    toast.textContent = message;

    toast.classList.add("show");


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2500);
}