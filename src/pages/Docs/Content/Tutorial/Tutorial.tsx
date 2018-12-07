import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'

import LinearProgress from '@material-ui/core/LinearProgress'
import Typography from '@material-ui/core/Typography'
import './Tutorial.scss'
import { ITutorial } from 'src/models/models'
import { db } from 'src/utils/firebase'
import { inject } from 'mobx-react'
import { DocStore } from 'src/stores/Docs/docs.store'

import TutorialDescription from './TutorialDescription/TutorialDescription'

const styles = {
  card: {
    minWidth: 275,
    maxWidth: 900,
    margin: '20px auto',
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
}

// The parent container injects router props along with a custom slug parameter (RouteComponentProps<IRouterCustomParams>).
// We also have injected the doc store to access its methods to get doc by slug.
// We can't directly provide the store as a prop though, and later user a get method to define it
interface IRouterCustomParams {
  slug: string
}
interface InjectedProps extends RouteComponentProps<IRouterCustomParams> {
  docStore: DocStore
}
interface IState {
  tutorial?: ITutorial
  isLoading: boolean
}
@inject('docStore')
export class Tutorial extends React.Component<
  RouteComponentProps<IRouterCustomParams>,
  IState
> {
  constructor(props: any) {
    super(props)
    this.state = {
      tutorial: undefined,
      isLoading: true,
    }
  }
  // workaround used later so that userStore can be called in render method when not existing on
  get injected() {
    return this.props as InjectedProps
  }

  public async componentWillMount() {
    const slug = this.props.match.params.slug
    const doc = await this.injected.docStore.getDocBySlug(slug)
    this.setState({
      tutorial: doc,
      isLoading: false,
    })
  }
  // use firebase to query tutorials and return doc that matches the given slug
  public async getTutorialBySlug(slug: string) {
    const ref = db
      .collection('documentation')
      .where('slug', '==', slug)
      .limit(1)
    const collection = await ref.get()
    return collection.docs.length > 0
      ? (collection.docs[0].data() as ITutorial)
      : undefined
  }

  public renderMultipleImages(step: any) {
    const preloadedImages = []
    for (const image of step.images) {
      const imageObj = new Image()
      imageObj.src = image
      preloadedImages.push({
        src: imageObj.src,
      })
    }
    return preloadedImages.map((image: any, index: number) => (
      <div className="step__image">
        <img src={image.src} />
      </div>
    ))
  }

  public renderUniqueImage(url: string) {
    return (
      <div className="step__image">
        <img src={url} />
      </div>
    )
  }
  public render() {
    const { tutorial, isLoading } = this.state
    if (tutorial) {
      return (
        <div>
          <TutorialDescription tutorial={tutorial} />
          {tutorial.steps.map((step: any, index: number) => (
            <div className="step__container" key={index}>
              <Card style={styles.card} className="step__card">
                <div className="step__header">
                  <Typography className="step__number" variant="h5">
                    Step {index + 1}
                  </Typography>
                </div>
                <CardContent>
                  <Typography
                    className="step__title"
                    variant="h5"
                    component="h2"
                  >
                    {step.title}
                  </Typography>
                  <Typography className="step__description" component="p">
                    {step.text}
                  </Typography>
                  {step.images.length > 1
                    ? this.renderMultipleImages(step)
                    : this.renderUniqueImage(step.images[0])}
                </CardContent>
              </Card>
            </div>
          ))}
          )}
        </div>
      )
    } else {
      return isLoading ? <LinearProgress /> : <div>Documentation not found</div>
    }
  }
}
