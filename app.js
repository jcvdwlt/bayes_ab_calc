console.log("Hello from my first JS file!")

function betaPDF(x, a, b) {
    // Beta probability density function impementation
    // using logarithms, no factorials involved.
    // Overcomes the problem with large integers
    return Math.exp(lnBetaPDF(x, a, b))
}
function lnBetaPDF(x, a, b) {
    // Log of the Beta Probability Density Function
    return ((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x)) - lnBetaFunc(a, b)
}
function lnBetaFunc(a, b) {
    // Log Beta Function
    // ln(Beta(x,y))
    foo = 0.0;

    for (i = 0; i < a - 2; i++) {
        foo += Math.log(a - 1 - i);
    }
    for (i = 0; i < b - 2; i++) {
        foo += Math.log(b - 1 - i);
    }
    for (i = 0; i < a + b - 2; i++) {
        foo -= Math.log(a + b - 1 - i);
    }
    return foo
}
function betaFunc(x, y) {
    // Beta Function
    // Beta(x,y) = e^(ln(Beta(x,y))
    return Math.exp(lnBetaFunc(x, y));
}

function betaFactory(a, b, scaling = 1) {

    let mean = 1 / (1 + b / a);
    let std = Math.sqrt(a * b / ((a + b) ** 2 * (a + b + 1)))

    let step = std * 6 / 1000;
    let start = Math.max(step, mean - 6 * std)
    let stop = Math.min(1, mean + 6 * std)

    let domain_array = [];
    let pdf_array = [];
    let cdf_array = [];
    let cdf_val = 0;

    for (let i = start; i < stop; i += step) {
        let pdf = betaPDF(i, a, b);
        domain_array.push(i * scaling)
        pdf_array.push(pdf / scaling)
        cdf_val += pdf * step
        cdf_array.push(cdf_val)
    }

    return {
        a: a,
        b: b,
        domain_array: domain_array,
        pdf_array: pdf_array,
        cdf_array: cdf_array,
        pdf: function (x) {
            betaPDF(x, this.a, this.b)
        },
        inv_cdf: function (x) {
            index = cdf_array.findIndex(v => v > x);
            return domain_array[index];
        },
        sample: function (n) {
            return Array.from({ length: n }, () => Math.random()).map(x => this.inv_cdf(x));
        },
    }
}

function updatePlot() {
    let visitorsA = parseInt(document.querySelector('#n_a').value);
    let conversionsA = parseInt(document.querySelector('#s_a').value);
    let valueA = parseFloat(document.querySelector('#v_a').value);

    let visitorsB = parseInt(document.querySelector('#n_b').value);
    let conversionsB = parseInt(document.querySelector('#s_b').value);
    let valueB = parseFloat(document.querySelector('#v_b').value);

    let betaA = betaFactory(conversionsA + 1, visitorsA - conversionsA + 1, valueA)
    let betaB = betaFactory(conversionsB + 1, visitorsB - conversionsB + 1, valueB)

    let n_samples = 10000;
    let samplesA = betaA.sample(n_samples)
    let samplesB = betaB.sample(n_samples)
    let bBest = 0

    let margin = parseFloat(document.querySelector('#margin').value) / 100;

    for (let i = 1; i < n_samples; i++) {
        if (samplesB[i] > samplesA[i] * (1 +
            margin)) {
            bBest += 1;
        }
    }

    document.querySelector('#result_string').innerHTML = (
        `The probability that <span class="B">B</span> is at least ${document.querySelector('#margin').value} % better than <span class="A">A</span> is ${(bBest / n_samples * 100).toFixed(1)} %`
    )

    let lineA = {
        x: betaA.domain_array,
        y: betaA.pdf_array,
        mode: 'lines',
        name: 'A',
        line: {
            color: '#e63946'
        },
    };

    let lineB = {
        x: betaB.domain_array,
        y: betaB.pdf_array,
        mode: 'lines',
        name: 'B',
        line: {
            color: '#a8dadc'
        },
    };

    let data = [lineA, lineB];

    let xAxisLabel = ''
    if (document.querySelector('#rate').checked) {
        xAxisLabel = 'Conversion rate';
    } else {
        xAxisLabel = 'Conversion value';
    }

    const layout = {
        // title: 'Quarter 1 Growth',
        xaxis: {
            title: xAxisLabel,
            showgrid: false,
        },
        yaxis: {
            showgrid: false,
            showticklabels: false
        }
    };
    const config = {
        displayModeBar: false, // this is the line that hides the bar.
    };

    Plotly.newPlot('plot', data, layout, config);
}

function hideValueInput() {
    if (document.querySelector('#rate').checked) {
        document.querySelectorAll('.value_data').forEach(x => x.style.visibility = 'hidden');
        document.querySelector('#v_a').value = '1';
        document.querySelector('#v_b').value = '1';
    } else {
        document.querySelectorAll('.value_data').forEach(x => x.style.visibility = 'visible')
    }
}

const defualtParams = {
    n_a: 100,
    s_a: 30,
    v_a: 1,
    n_b: 100,
    s_b: 35,
    v_b: 1,
    margin: 5
}

let calculate = true;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

for (const def in defualtParams) {
    if (urlParams.has(def)) {
        document.querySelector(`#${def}`).value = urlParams.get(def);
        console.log(`From url ${def}: ${urlParams.get(def)}`);
    } else {
        document.querySelector(`#${def}`).value = defualtParams[def];
        calculate = false;
        console.log(`Default ${def}: ${defualtParams[def]}`);
    }
}


if (urlParams.get('test_type') === "value") {
    document.querySelector('#value').checked = true;
    hideValueInput();
} else {
    document.querySelector('#rate').checked = true;
    hideValueInput();
};

if (calculate) {
    updatePlot()
}
