const increment = (function () { // simple counter for IDs sequence
    let count: number = 0

    return function(){
        return ++count
    }
})()

export default function generateID() {
    let id: string = ""
    return "0-" + String(Date.now()) + "-" + String(increment())
}