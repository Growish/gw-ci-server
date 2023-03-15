class Stack {

    constructor(maxLength = 5) {
        this.items = [];
        this.maxLength = maxLength;
    }

    push(message) {

        this.items.push(message);

        if(this.items.length > this.maxLength)
            this.items.shift();

    }

    print() {

        let str = "";
        for (let i = 0; i < this.items.length; i++)
            str += this.items[i] + " ";
        return str;

    }

}

module.exports = Stack;