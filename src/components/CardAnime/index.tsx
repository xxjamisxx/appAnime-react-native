import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Animated, Dimensions, Image, Text} from 'react-native';
import {
  Directions,
  FlingGestureHandler,
  State,
  BorderlessButton,
} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import OverFlowItems from '../OverFlowItems';
import {Container, CardList} from './styles';
import api from '../../service/api';
//import axios from 'axios';

interface DataProps {
  data: Array<{
    id: Number;
    attributes: {
      averageRating: String;
      youtubeVideoId: String;
      episodeCount: Number;
      canonicalTitle: String;
      synopsis: String;
      posterImage: {
        medium: String;
      };
    };
  }>;
  links: {
    first?: String;
    prev?: String;
    next?: String;
  };
}

interface LinksNew {
  links: {
    first?: String;
    prev?: String;
    next?: String;
  };
}

const {width} = Dimensions.get('screen');
const ITEM_WIDTH = width * 0.8;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;
const VISIBLE_ITEMS = 3;

const Card = () => {
  const [dataAnime, setData] = useState<DataProps>();
  const [linksNew, setLinksNew] = useState<LinksNew>({} as LinksNew);
  const scrollXindex = useRef(new Animated.Value(0)).current;
  const scrollXindexAnimated = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const navigation = useNavigation();

  const setActiveIndex = useCallback((activeIndex) => {
    scrollXindex.setValue(activeIndex);
    setIndex(activeIndex);
  }, []);

  const setNewData = useCallback((newData,sense) => {
    api.get(newData)
    .then((resp) => {
      setData(resp.data);
      if(sense === 'LEFT'){
        scrollXindex.setValue(0);
        setIndex(0); 
      }else if(sense ===  'RIGHT'){
        scrollXindex.setValue(4);
        setIndex(4);
      }
    });
  },[])

  useEffect(() => {
    Animated.spring(scrollXindexAnimated, {
      toValue: scrollXindex,
      useNativeDriver: true,
    }).start();
  });

  useEffect(() => {
    async function load() {
      await api
        .get(`anime?page[limit]=5&page[offset]=0`)
        .then((resp) => {
          setData(resp.data);
          setLinksNew(resp.data.links);
        })
        .catch((err) => {
          console.log(err);
        });
    }

    load();
  }, []);

  if (!dataAnime) {
    return (
      <View>
      
      </View>
    );
  }

  function handleOnPressImg(Data: DataProps) {
    navigation.navigate('details', {Data});
  }

  return (
    <FlingGestureHandler
      direction={Directions.LEFT}
      onHandlerStateChange={(ev) => {
        if (ev.nativeEvent.state === State.END) {
          if (index === dataAnime.data.length - 1) {
             setNewData(dataAnime.links.next,'LEFT')
             
            return;
          }
          setActiveIndex(index + 1);
        }
      }}>
      <FlingGestureHandler
        direction={Directions.RIGHT}
        onHandlerStateChange={(ev) => {
          if (ev.nativeEvent.state === State.END) {
            if (index === 0) {
              if (dataAnime.links.prev) {
                setNewData(dataAnime.links.prev,'RIGHT')
                
                return;
              }
              return;
            }
            setActiveIndex(index - 1);
          }
        }}>
        <Container>
          <CardList
            data={dataAnime.data}
            keyExtractor={(_, index) => String(index)}
            inverted
            scrollEnabled={false}
            removeClippedSubviews={false}
            contentContainerStyle={{
              flex: 1,
              justifyContent: 'center',
              padding: 10 * 2,
            }}
            CellRendererComponent={({
              item,
              index,
              children,
              style,
              ...props
            }) => {
              const newStyle = [style, {zIndex: dataAnime.data.length - index}];
              return (
                <View style={newStyle} index={index} {...props}>
                  {children}
                </View>
              );
            }}
            horizontal
            renderItem={({item, index}: any) => {
              const inputRange = [index - 1, index, index + 1];
              const translateX = scrollXindexAnimated.interpolate({
                inputRange,
                outputRange: [50, 0, -100],
              });

              const scale = scrollXindexAnimated.interpolate({
                inputRange,
                outputRange: [0.8, 1, 1.3],
              });

              const opacity = scrollXindexAnimated.interpolate({
                inputRange,
                outputRange: [1 - 1 / VISIBLE_ITEMS, 1, 0],
              });

              return (
                <Animated.View
                  style={{
                    position: 'absolute',
                    left: -ITEM_WIDTH / 2,
                    opacity,
                    transform: [
                      {
                        translateX,
                      },
                      {
                        scale,
                      },
                    ],
                  }}>
                  <BorderlessButton
                    onPress={() => handleOnPressImg(item)}
                    borderless={false}>
                    <Image
                      resizeMode="stretch"
                      source={{uri: item.attributes.posterImage.medium}}
                      style={{
                        width: ITEM_WIDTH,
                        height: ITEM_HEIGHT,
                      }}
                    />
                  </BorderlessButton>
                </Animated.View>
              );
            }}
          />
          <OverFlowItems
            data={dataAnime.data}
            scrollXAnimated={scrollXindexAnimated}
          />
        </Container>
      </FlingGestureHandler>
    </FlingGestureHandler>
  );
};

export default Card;
