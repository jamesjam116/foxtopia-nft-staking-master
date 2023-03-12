import { Button } from "./Widget"

export default function HakuCollectionBox(props: {
    title?: string,
}) {

    return (
        <div className="collection-box">
            <div className="box-body">
                <div className="box-header">
                    <h3 className="title">{props.title && props.title}</h3>
                    <div className="button-group">
                        <Button variant="secondary" onClick={console.log}>
                            STAKE
                        </Button>
                        <Button variant="secondary" onClick={console.log}>
                            STAKE ALL
                        </Button>
                    </div>
                </div>
                <div className="box-content">
                    <p className="notice">Our HAKU collection will be available shortly after launch.  Every HAKU staked with a fox will provide you with an additional 1.5x boost to the pair&#39;s combined rewards.</p>
                </div>
            </div>
        </div>
    )
}